// client/src/utils/directoryTraversalDetector.test.ts

import { describe, it, expect } from 'vitest';
import { detectDirectoryTraversal } from './directoryTraversalDetector';
import type { Packet } from '@/types/packet';

describe('detectDirectoryTraversal', () => {
  const createPacket = (rawDataString: string): Packet => {
    return {
      id: 'test-packet-id',
      timestamp: 1234567890,
      sourceIP: '192.168.1.100',
      destIP: '10.0.0.1',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
      length: 100,
      rawData: new TextEncoder().encode(rawDataString).buffer,
      detectedProtocols: ['HTTP', 'TCP'],
    };
  };

  it('should detect standard traversal', () => {
    const rawData =
      'GET /../../etc/passwd HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectDirectoryTraversal(packet);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('Directory Traversal');
    expect(threats[0].severity).toBe('high');
    expect(threats[0].mitreAttack).toContain('T1083');
  });

  it('should detect encoded traversal', () => {
    const rawData = 'GET /%2e%2e%2f%2e%2e%2fwindows/win.ini HTTP/1.1\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectDirectoryTraversal(packet);

    expect(threats).toHaveLength(1);
  });

  it('should detect absolute paths', () => {
    const rawData = 'GET /?file=/etc/shadow HTTP/1.1\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectDirectoryTraversal(packet);

    expect(threats).toHaveLength(1);
  });

  it('should detect Windows absolute paths', () => {
    const rawData =
      'GET /?file=C:\\Windows\\System32\\cmd.exe HTTP/1.1\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectDirectoryTraversal(packet);

    expect(threats).toHaveLength(1);
  });

  it('should not detect benign traffic', () => {
    const rawData =
      'GET /images/logo.png HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectDirectoryTraversal(packet);

    expect(threats).toHaveLength(0);
  });
});
