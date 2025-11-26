import React from 'react';

/**
 * Generates a formatted hex dump and ASCII representation from raw ArrayBuffer data.
 * @param rawData The ArrayBuffer containing the packet's raw data.
 * @returns An object with fullHexDump (formatted hex with ASCII) and fullAsciiDump (ASCII representation only).
 */
export const generateHexDump = (rawData: ArrayBuffer) => {
  const bytes = new Uint8Array(rawData);
  const hexLines: string[] = [];
  const asciiParts: string[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const offset = i.toString(16).padStart(4, '0');
    const chunk = bytes.slice(i, i + 16);

    const hexPart = Array.from(chunk)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(16 * 3 - 1, ' '); // Pad to ensure alignment for shorter last lines

    const asciiPart = Array.from(chunk)
      .map(byte => (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.')
      .join('');
    
    asciiParts.push(asciiPart);

    hexLines.push(`${offset} ${hexPart} ${asciiPart}`);
  }

  return {
    fullHexDump: hexLines.join('\n'),
    fullAsciiDump: asciiParts.join(''),
  };
};

interface HexDumpViewerProps {
  rawData: ArrayBuffer;
}

const HexDumpViewer: React.FC<HexDumpViewerProps> = ({ rawData }) => {
  const { fullHexDump } = generateHexDump(rawData);

  return (
    <pre className="text-sm font-mono whitespace-pre-wrap break-all bg-slate-900 p-2 rounded-lg">
      {fullHexDump}
    </pre>
  );
};

export default HexDumpViewer;