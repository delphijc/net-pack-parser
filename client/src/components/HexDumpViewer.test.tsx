import { describe, it, expect } from 'vitest';
import { generateHexDump } from './HexDumpViewer';

describe('generateHexDump', () => {
  // Helper to convert string to ArrayBuffer
  const stringToArrayBuffer = (str: string): ArrayBuffer => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  };

  // Helper to reconstruct the hex dump string from the structured output for testing

  const reconstructFullHexDump = (lines: Array<any>) => {
    return lines
      .map((line) => {
        const hexPart = line.hexBytes.map((byte: any) => byte.char).join(' ');

        const asciiPart = line.asciiChars
          .map((char: any) => char.char)
          .join('');

        // Calculate padding based on the logic in generateHexDump for alignment

        const padding = ' '.repeat(
          Math.max(0, (16 - line.hexBytes.length) * 3 + 1),
        );

        return `${line.offset} ${hexPart}${padding}${asciiPart}`;
      })
      .join('\n');
  };

  it('should correctly format a basic hex dump with ASCII representation', () => {
    const data = stringToArrayBuffer('Hello, world!');

    const { lines, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump =
      '0000 48 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21          Hello, world!';

    const expectedAsciiDump = 'Hello, world!';

    expect(reconstructFullHexDump(lines)).toBe(expectedHexDump);

    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should handle non-printable ASCII characters correctly (replace with dot)', () => {
    const data = new Uint8Array([0x00, 0x01, 0x41, 0x7a, 0x80, 0xff]).buffer; // NUL, SOH, A, z, non-ASCII

    const { lines, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump =
      '0000 00 01 41 7a 80 ff                               ..Az..';

    const expectedAsciiDump = '..Az..';

    expect(reconstructFullHexDump(lines)).toBe(expectedHexDump);

    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should correctly format data less than 16 bytes', () => {
    const data = stringToArrayBuffer('Short');

    const { lines, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump =
      '0000 53 68 6f 72 74                                  Short';

    const expectedAsciiDump = 'Short';

    expect(reconstructFullHexDump(lines)).toBe(expectedHexDump);

    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should correctly format data with an exact multiple of 16 bytes', () => {
    const data = stringToArrayBuffer('0123456789abcdef'); // 16 bytes

    const { lines, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump =
      '0000 30 31 32 33 34 35 36 37 38 39 61 62 63 64 65 66 0123456789abcdef';

    const expectedAsciiDump = '0123456789abcdef';

    expect(reconstructFullHexDump(lines)).toBe(expectedHexDump);

    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should handle empty data', () => {
    const data = new ArrayBuffer(0);

    const { lines, fullAsciiDump } = generateHexDump(data);

    expect(lines).toEqual([]);

    expect(fullAsciiDump).toBe('');
  });

  it('should correctly format data spanning multiple lines', () => {
    // 28 bytes of data

    const data = stringToArrayBuffer('0123456789abcdefABCDEF012345');

    const { lines, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump = [
      '0000 30 31 32 33 34 35 36 37 38 39 61 62 63 64 65 66 0123456789abcdef',

      '0010 41 42 43 44 45 46 30 31 32 33 34 35             ABCDEF012345',
    ].join('\n');

    const expectedAsciiDump = '0123456789abcdefABCDEF012345';

    expect(reconstructFullHexDump(lines)).toBe(expectedHexDump);

    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should correctly apply highlighting', () => {
    const data = stringToArrayBuffer('0123456789abcdef');

    // Highlight '345' (offset 3, length 3)

    const highlightRanges = [{ offset: 3, length: 3 }];

    const { lines } = generateHexDump(data, highlightRanges);

    // Verify hex part highlighting

    expect(lines[0].hexBytes[3].highlighted).toBe(true); // '3'

    expect(lines[0].hexBytes[4].highlighted).toBe(true); // '4'

    expect(lines[0].hexBytes[5].highlighted).toBe(true); // '5'

    expect(lines[0].hexBytes[2].highlighted).toBe(false); // '2'

    expect(lines[0].hexBytes[6].highlighted).toBe(false); // '6'

    // Verify ascii part highlighting

    expect(lines[0].asciiChars[3].highlighted).toBe(true); // '3'

    expect(lines[0].asciiChars[4].highlighted).toBe(true); // '4'

    expect(lines[0].asciiChars[5].highlighted).toBe(true); // '5'

    expect(lines[0].asciiChars[2].highlighted).toBe(false); // '2'

    expect(lines[0].asciiChars[6].highlighted).toBe(false); // '6'
  });
});
