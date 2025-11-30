// client/src/utils/protocolDetector.test.ts
import { describe, it, expect } from 'vitest';
import { detectProtocols } from './protocolDetector';
import type { Packet } from '../types/packet';

describe('detectProtocols', () => {
  // Helper to create a minimal packet for testing
  const createTestPacket = (
    sourcePort: number,
    destPort: number,
    protocol: string,
    payload: Uint8Array = new Uint8Array(),
  ): Packet => ({
    id: 'test-id',
    timestamp: Date.now(),
    sourceIP: '127.0.0.1',
    destIP: '127.0.0.1',
    sourcePort,
    destPort,
    protocol,
    length: payload.length,
    rawData: payload.buffer as ArrayBuffer, // Create a copy as ArrayBuffer
    detectedProtocols: [], // This will be populated by the function
  });

  it('should detect HTTP based on standard port (80)', () => {
    const packet = createTestPacket(12345, 80, 'TCP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('HTTP');
  });

  it('should detect HTTP based on non-standard port (8080)', () => {
    const packet = createTestPacket(12345, 8080, 'TCP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('HTTP');
  });

  it('should detect HTTPS based on standard port (443)', () => {
    const packet = createTestPacket(12345, 443, 'TCP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('HTTPS');
  });

  it('should detect DNS based on standard port (53) and UDP protocol', () => {
    const packet = createTestPacket(12345, 53, 'UDP', new Uint8Array(12)); // DNS requires at least 12 bytes payload
    expect(detectProtocols(packet, new Uint8Array(12))).toContain('DNS');
  });

  it('should detect FTP based on standard port (21)', () => {
    const packet = createTestPacket(12345, 21, 'TCP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('FTP');
  });

  it('should detect SSH based on standard port (22)', () => {
    const packet = createTestPacket(12345, 22, 'TCP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('SSH');
  });

  it('should detect TCP from IP header protocol field', () => {
    const packet = createTestPacket(10000, 20000, 'TCP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('TCP');
  });

  it('should detect UDP from IP header protocol field', () => {
    const packet = createTestPacket(10000, 20000, 'UDP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('UDP');
  });

  it('should detect ICMP from IP header protocol field', () => {
    const packet = createTestPacket(0, 0, 'ICMP'); // ICMP usually has source/dest ports 0
    expect(detectProtocols(packet, new Uint8Array())).toContain('ICMP');
  });

  it('should detect HTTP via DPI for GET request on non-standard port', () => {
    const payload = new TextEncoder().encode('GET /index.html HTTP/1.1');
    const packet = createTestPacket(12345, 9000, 'TCP', payload); // Non-standard port
    expect(detectProtocols(packet, payload)).toContain('HTTP');
  });

  it('should detect HTTP via DPI for POST request on non-standard port', () => {
    const payload = new TextEncoder().encode('POST /api/data HTTP/1.1');
    const packet = createTestPacket(12345, 9000, 'TCP', payload);
    expect(detectProtocols(packet, payload)).toContain('HTTP');
  });

  it('should detect HTTP via DPI for HTTP/1.1 response on non-standard port', () => {
    const payload = new TextEncoder().encode('HTTP/1.1 200 OK');
    const packet = createTestPacket(9000, 12345, 'TCP', payload);
    expect(detectProtocols(packet, payload)).toContain('HTTP');
  });

  it('should return "Unknown (Port X)" if no protocols are detected', () => {
    const packet = createTestPacket(50000, 50001, 'SCTP'); // Unknown protocol, unknown ports
    const detected = detectProtocols(packet, new Uint8Array());
    expect(detected).toEqual(['Unknown (Port 50001)']);
  });

  it('should combine multiple detections (e.g., TCP and HTTP)', () => {
    const payload = new TextEncoder().encode('GET / HTTP/1.1');
    const packet = createTestPacket(12345, 80, 'TCP', payload);
    const detected = detectProtocols(packet, payload);
    expect(detected).toContain('TCP');
    expect(detected).toContain('HTTP');
  });

  it('should not duplicate protocols if detected by multiple methods', () => {
    const payload = new TextEncoder().encode('GET / HTTP/1.1');
    const packet = createTestPacket(12345, 80, 'TCP', payload);
    const detected = detectProtocols(packet, payload);
    // Should contain TCP and HTTP once, even though 80 is HTTP and payload is HTTP
    expect(detected.filter((p) => p === 'HTTP').length).toBe(1);
    expect(detected.filter((p) => p === 'TCP').length).toBe(1);
  });

  it('should handle empty payload gracefully', () => {
    const packet = createTestPacket(12345, 80, 'TCP');
    expect(detectProtocols(packet, new Uint8Array())).toContain('HTTP');
  });

  it('should handle very short payload for DPI without errors', () => {
    const payload = new TextEncoder().encode('GET'); // Too short for full "GET "
    const packet = createTestPacket(12345, 9000, 'TCP', payload);
    expect(detectProtocols(packet, payload)).not.toContain('HTTP');
    expect(detectProtocols(packet, payload)).toContain('TCP'); // Still detects TCP from IP header
  });
});
