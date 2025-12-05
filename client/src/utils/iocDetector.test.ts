/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectIOCs } from './iocDetector';
import { iocService } from '../services/iocService';
import type { ParsedPacket } from '../types/packet';

// Mock iocService
vi.mock('../services/iocService', () => ({
  iocService: {
    getIOCCache: vi.fn(),
  },
}));

describe('detectIOCs', () => {
  const mockPacket: ParsedPacket = {
    id: 'pkt-1',
    timestamp: 1234567890,
    sourceIP: '10.0.0.1',
    destIP: '8.8.8.8',
    sourcePort: 12345,
    destPort: 53,
    protocol: 'DNS',
    length: 100,
    rawData: new ArrayBuffer(0),
    dnsQuery: 'malicious.com',
    detectedProtocols: ['DNS'],
  };

  const mockIOCs = [
    {
      id: 'ioc-1',
      type: 'ip',
      value: '1.2.3.4',
      severity: 'high',
      enabled: true,
      description: 'Bad IP',
    },
    {
      id: 'ioc-2',
      type: 'domain',
      value: 'malicious.com',
      severity: 'critical',
      enabled: true,
      description: 'Bad Domain',
    },
    {
      id: 'ioc-3',
      type: 'url',
      value: 'http://evil.com/malware',
      severity: 'critical',
      enabled: true,
      description: 'Bad URL',
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    const ipCache = new Set<string>();
    const domainCache = new Set<string>();
    const hashCache = new Set<string>();
    const urlCache = new Set<string>();
    const iocMap = new Map<string, any>();

    mockIOCs.forEach(ioc => {
      if (ioc.type === 'ip') ipCache.add(ioc.value);
      if (ioc.type === 'domain') domainCache.add(ioc.value);
      if (ioc.type === 'url') urlCache.add(ioc.value);
      iocMap.set(ioc.value, ioc);
    });

    (iocService.getIOCCache as any).mockReturnValue({
      ip: ipCache,
      domain: domainCache,
      hash: hashCache,
      url: urlCache,
      map: iocMap,
    });
  });

  it('should detect malicious IP (source)', async () => {
    const packet = { ...mockPacket, sourceIP: '1.2.3.4', dnsQuery: undefined };
    const threats = await detectIOCs(packet as ParsedPacket);
    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('ioc_match');
    expect(threats[0].description).toContain('1.2.3.4');
  });

  it('should detect malicious IP (dest)', async () => {
    const packet = { ...mockPacket, destIP: '1.2.3.4', dnsQuery: undefined };
    const threats = await detectIOCs(packet as ParsedPacket);
    expect(threats).toHaveLength(1);
    expect(threats[0].description).toContain('1.2.3.4');
  });

  it('should detect malicious Domain (DNS)', async () => {
    const packet = {
      ...mockPacket,
      protocol: 'DNS',
      dnsQuery: 'malicious.com',
    };
    const threats = await detectIOCs(packet);
    expect(threats).toHaveLength(1);
    expect(threats[0].description).toContain('malicious.com');
  });

  it('should detect malicious Domain (HTTP Host)', async () => {
    const packet = {
      ...mockPacket,
      protocol: 'HTTP',
      httpHost: 'malicious.com',
    };
    const threats = await detectIOCs(packet);
    expect(threats).toHaveLength(1);
    expect(threats[0].description).toContain('malicious.com');
  });

  it('should detect malicious URL', async () => {
    const packet = {
      ...mockPacket,
      protocol: 'HTTP',
      httpHost: 'evil.com',
      extractedStrings: [
        {
          id: 'str-1',
          type: 'URL',
          value: 'http://evil.com/malware',
          packetId: 'pkt-1',
          payloadOffset: 0,
          length: 20
        }
      ]
    };
    const threats = await detectIOCs(packet as any);
    expect(threats).toHaveLength(1);
    expect(threats[0].description).toContain('http://evil.com/malware');
  });
});
