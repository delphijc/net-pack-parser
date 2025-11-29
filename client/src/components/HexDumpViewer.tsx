import React, { useMemo } from 'react'; // Import useMemo

interface HexDumpLine {
  offset: string;
  hexBytes: Array<{ char: string; highlighted: boolean }>;
  asciiChars: Array<{ char: string; highlighted: boolean }>;
}

/**
 * Generates structured hex dump data and ASCII representation from raw ArrayBuffer data.
 * @param rawData The ArrayBuffer containing the packet's raw data.
 * @param highlightRanges An optional array of {offset, length} to highlight.
 * @returns An object with structured hex dump lines and a plain ASCII string.
 */
export const generateHexDump = (
  rawData: ArrayBuffer,
  highlightRanges: Array<{ offset: number; length: number }> = []
) => {
  const bytes = new Uint8Array(rawData);
  const hexDumpLines: HexDumpLine[] = [];
  const fullAsciiDumpText: string[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const offset = i.toString(16).padStart(4, '0');
    const chunk = bytes.slice(i, i + 16);

    const hexBytes: Array<{ char: string; highlighted: boolean }> = [];
    const asciiChars: Array<{ char: string; highlighted: boolean }> = [];
    const currentAsciiLine: string[] = [];

    for (let j = 0; j < chunk.length; j++) {
      const byteOffset = i + j;
      const byte = chunk[j];
      const isHighlighted = highlightRanges.some(
        (range) => byteOffset >= range.offset && byteOffset < range.offset + range.length
      );

      const hexChar = byte.toString(16).padStart(2, '0');
      const asciiChar = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';

      hexBytes.push({ char: hexChar, highlighted: isHighlighted });
      asciiChars.push({ char: asciiChar, highlighted: isHighlighted });
      currentAsciiLine.push(asciiChar);
    }

    hexDumpLines.push({ offset, hexBytes, asciiChars });
    fullAsciiDumpText.push(currentAsciiLine.join(''));
  }

  return {
    lines: hexDumpLines,
    fullAsciiDump: fullAsciiDumpText.join(''),
  };
};

interface HexDumpViewerProps {
  rawData: ArrayBuffer;
  highlightRanges?: Array<{ offset: number; length: number }>; // New optional prop
  searchString?: string | null;
  caseSensitive?: boolean;
}

const HexDumpViewer: React.FC<HexDumpViewerProps> = ({ rawData, highlightRanges = [] }) => {
  const { lines } = useMemo(() => generateHexDump(rawData, highlightRanges), [rawData, highlightRanges]);

  if (rawData.byteLength === 0) {
    return null; // Render nothing for empty data
  }

  return (
    <pre className="text-sm font-mono whitespace-pre-wrap break-all bg-slate-900 p-2 rounded-lg">
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className="flex">
          <span className="text-gray-500 mr-2">{line.offset}</span>
          <span className="font-mono hex-part">
            {line.hexBytes.map((byte, byteIndex) => (
              <React.Fragment key={`hex-${lineIndex}-${byteIndex}`}>
                <span className={byte.highlighted ? 'bg-yellow-500 text-black' : ''}>
                  {byte.char}
                </span>
                {byteIndex < line.hexBytes.length - 1 ? ' ' : ''}
              </React.Fragment>
            ))}
            {/* Pad with spaces for alignment if line is shorter than 16 bytes */}
            {' '.repeat(Math.max(0, (16 - line.hexBytes.length) * 3 + 1))}
          </span>
          <span className="font-mono ml-2 ascii-part">
            {line.asciiChars.map((char, charIndex) => (
              <span key={`ascii-${lineIndex}-${charIndex}`} className={char.highlighted ? 'bg-yellow-500 text-black' : ''}>
                {char.char}
              </span>
            ))}
          </span>
        </div>
      ))}
    </pre>
  );
};

export default HexDumpViewer;