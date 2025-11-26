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

  it('should correctly format a basic hex dump with ASCII representation', () => {
    const data = stringToArrayBuffer('Hello, world!');
    const { fullHexDump, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump = '0000 48 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21          Hello, world!';
    const expectedAsciiDump = 'Hello, world!';

    expect(fullHexDump).toBe(expectedHexDump);
    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should handle non-printable ASCII characters correctly (replace with dot)', () => {
    const data = new Uint8Array([0x00, 0x01, 0x41, 0x7a, 0x80, 0xff]).buffer; // NUL, SOH, A, z, non-ASCII
    const { fullHexDump, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump = '0000 00 01 41 7a 80 ff                               ..Az..';
    const expectedAsciiDump = '..Az..';

    expect(fullHexDump).toBe(expectedHexDump);
    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should correctly format data less than 16 bytes', () => {
    const data = stringToArrayBuffer('Short');
    const { fullHexDump, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump = '0000 53 68 6f 72 74                                  Short';
    const expectedAsciiDump = 'Short';

    expect(fullHexDump).toBe(expectedHexDump);
    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should correctly format data with an exact multiple of 16 bytes', () => {
    const data = stringToArrayBuffer('0123456789abcdef'); // 16 bytes
    const { fullHexDump, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump = '0000 30 31 32 33 34 35 36 37 38 39 61 62 63 64 65 66 0123456789abcdef';
    const expectedAsciiDump = '0123456789abcdef';

    expect(fullHexDump).toBe(expectedHexDump);
    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });

  it('should handle empty data', () => {
    const data = new ArrayBuffer(0);
    const { fullHexDump, fullAsciiDump } = generateHexDump(data);

    expect(fullHexDump).toBe('');
    expect(fullAsciiDump).toBe('');
  });

  it('should correctly format data spanning multiple lines', () => {
    // 28 bytes of data
    const data = stringToArrayBuffer('0123456789abcdefABCDEF012345');
    const { fullHexDump, fullAsciiDump } = generateHexDump(data);

    const expectedHexDump = [
      '0000 30 31 32 33 34 35 36 37 38 39 61 62 63 64 65 66 0123456789abcdef',
      '0010 41 42 43 44 45 46 30 31 32 33 34 35             ABCDEF012345'
    ].join('\n');
    const expectedAsciiDump = '0123456789abcdefABCDEF012345';

    expect(fullHexDump).toBe(expectedHexDump);
    expect(fullAsciiDump).toBe(expectedAsciiDump);
  });
});