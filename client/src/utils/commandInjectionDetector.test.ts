// client/src/utils/commandInjectionDetector.test.ts

import { describe, it, expect } from 'vitest';
import { detectCommandInjection } from './commandInjectionDetector';
import type { Packet } from '@/types/packet';

describe('detectCommandInjection', () => {
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

  it('should detect shell command injection', () => {
    const rawData =
      'GET /?cmd=; cat /etc/passwd HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectCommandInjection(packet);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('Command Injection');
    expect(threats[0].severity).toBe('critical');
    expect(threats[0].mitreAttack).toContain('T1059');
  });

  it('should detect piped commands', () => {
    const rawData = 'POST /login HTTP/1.1\r\n\r\nuser=admin | whoami';
    const packet = createPacket(rawData);
    const threats = detectCommandInjection(packet);

    expect(threats).toHaveLength(1);
  });

  it('should detect Windows commands', () => {
    const rawData = 'GET /?ip=127.0.0.1 & dir HTTP/1.1\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectCommandInjection(packet);

    expect(threats).toHaveLength(1);
  });

  it('should detect PowerShell', () => {
    const rawData = 'GET /?cmd=powershell -c Get-Process HTTP/1.1\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectCommandInjection(packet);

    expect(threats).toHaveLength(1);
  });

  it('should not detect benign traffic', () => {
    const rawData =
      'GET /search?q=cat+food HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectCommandInjection(packet);

    expect(threats).toHaveLength(0);
  });
});
