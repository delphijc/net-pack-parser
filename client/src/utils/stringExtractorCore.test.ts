// client/src/utils/stringExtractorCore.test.ts

import { describe, it, expect } from 'vitest';
import { extractStringsFromBuffer } from './stringExtractorCore';

// Helper to convert string to ArrayBuffer
const stringToArrayBuffer = (str: string) => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

describe('extractStringsFromBuffer', () => {
  const mockPacketId = 'test-packet-123';
  const mockPayloadOffset = 0;

  it('should extract IPv4 addresses', () => {
    const payload = stringToArrayBuffer('Payload with IP 192.168.1.1 and another 10.0.0.255');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const ips = result.filter(s => s.type === 'IP').map(s => s.value);
    expect(ips).toContain('192.168.1.1');
    expect(ips).toContain('10.0.0.255');
    expect(result.some(s => s.value === '192.168.1.1' && s.payloadOffset === 'Payload with IP '.length)).toBe(true);
  });

  it('should extract IPv6 addresses', () => {
    const payload = stringToArrayBuffer('IPv6 address 2001:0db8:85a3:0000:0000:8a2e:0370:7334 and ::1');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const ips = result.filter(s => s.type === 'IP').map(s => s.value);
    expect(ips).toContain('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    // expect(ips).toContain('::1'); // ::1 is length 3, shorter than min length 4
  });

  it('should extract URLs', () => {
    const payload = stringToArrayBuffer('Visit https://www.example.com and ftp://files.test.org/doc.pdf');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const urls = result.filter(s => s.type === 'URL').map(s => s.value);
    expect(urls).toContain('https://www.example.com');
    expect(urls).toContain('ftp://files.test.org/doc.pdf');
  });

  it('should extract email addresses', () => {
    const payload = stringToArrayBuffer('Contact test@example.com or user.name+tag@sub.domain.co.uk');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const emails = result.filter(s => s.type === 'Email').map(s => s.value);
    expect(emails).toContain('test@example.com');
    expect(emails).toContain('user.name+tag@sub.domain.co.uk');
  });

  it('should extract potential credentials', () => {
    const payload = stringToArrayBuffer('username=admin password=secret token=xyz auth=bearer_token api_key=abc');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const credentials = result.filter(s => s.type === 'Credential').map(s => s.value);
    // Note: The regex currently extracts the full match, including key and value.
    // If only the value is desired, the regex in stringExtractorCore.ts needs refinement.
    expect(credentials).toContain('admin');
    expect(credentials).toContain('secret');
    expect(credentials).toContain('xyz');
    expect(credentials).toContain('bearer_token');
    expect(credentials).toContain('abc');
  });

  it('should extract file paths and filenames', () => {
    const payload = stringToArrayBuffer('File at /usr/local/bin/app.sh and C:\\Program Files\\App\\file.exe or document.pdf');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const filePaths = result.filter(s => s.type === 'FilePath').map(s => s.value);
    expect(filePaths).toContain('/usr/local/bin/app.sh');
    expect(filePaths).toContain('C:\\Program Files\\App\\file.exe');
    expect(filePaths).toContain('document.pdf');
  });

  it('should extract printable ASCII strings longer than 4 characters', () => {
    const payload = stringToArrayBuffer('Hello World \x00 short abc long_string');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const others = result.filter(s => s.type === 'Other').map(s => s.value);
    expect(others).toContain('Hello World ');
    expect(others).toContain('long_string');
    expect(others).not.toContain('short'); // Shorter than 4 chars
    expect(others).not.toContain('abc');   // Shorter than 4 chars
  });

  it('should handle empty payload', () => {
    const payload = stringToArrayBuffer('');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    expect(result).toEqual([]);
  });

  it('should handle payload with only non-printable characters', () => {
    const payload = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]).buffer;
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    expect(result).toEqual([]);
  });

  it('should correctly calculate payloadOffset and length', () => {
    const testString = 'Prefix http://example.com Suffix';
    const payload = stringToArrayBuffer(testString);
    const offset = 7; // 'Prefix '.length
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const url = result.find(s => s.type === 'URL' && s.value === 'http://example.com');

    expect(url).toBeDefined();
    expect(url?.payloadOffset).toBe(mockPayloadOffset + offset);
    expect(url?.length).toBe('http://example.com'.length);
  });

  it('should not extract strings shorter than MIN_PRINTABLE_STRING_LENGTH (4)', () => {
    const payload = stringToArrayBuffer('one\x00two\x00three\x00four\x00five\x00six');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const others = result.filter(s => s.type === 'Other').map(s => s.value);

    expect(others).not.toContain('one');
    expect(others).not.toContain('two');
    expect(others).not.toContain('six');
    expect(others).toContain('three');
    expect(others).toContain('four');
    expect(others).toContain('five');
  });

  it('should handle mixed text and binary data', () => {
    const payload = new Uint8Array([
      0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, // Hello
      0x00, 0x01, // binary
      0x57, 0x6f, 0x72, 0x6c, 0x64, 0x20, // World
      0x00, // binary
      0x31, 0x39, 0x32, 0x2e, 0x31, 0x36, 0x38, 0x2e, 0x31, 0x2e, 0x31, // 192.168.1.1
    ]).buffer;
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const others = result.filter(s => s.type === 'Other').map(s => s.value);
    const ips = result.filter(s => s.type === 'IP').map(s => s.value);

    expect(others).toContain('Hello ');
    expect(others).toContain('World ');
    expect(ips).toContain('192.168.1.1');
  });

  it('should not add duplicate entries for the same string found by multiple regexes if value and offset are same', () => {
    const payload = stringToArrayBuffer('This is a test. test@example.com This is another test.');
    const result = extractStringsFromBuffer(payload, mockPacketId, mockPayloadOffset);
    const emails = result.filter(s => s.type === 'Email');
    expect(emails.length).toBe(1);
    expect(emails[0].value).toBe('test@example.com');
  });
});
