// client/src/utils/multiCriteriaSearch.test.ts

import { describe, it, expect } from 'vitest';
import { getMatchDetails, type MultiSearchCriteria } from './multiCriteriaSearch';
import type { Packet } from '@/types/packet';

describe('getMatchDetails', () => {
  const createTestPacket = (overrides?: Partial<Packet>): Packet => ({
    id: '1',
    timestamp: Date.now(),
    sourceIP: '192.168.1.1',
    destIP: '192.168.1.2',
    sourcePort: 80,
    destPort: 443,
    protocol: 'TCP',
    length: 100,
    rawData: new TextEncoder().encode('test payload content').buffer,
    detectedProtocols: ['HTTP'],
    ...overrides
  });

  it('should return empty match details when no criteria provided', () => {
    const packet = createTestPacket();
    const details = getMatchDetails(packet, null as any);

    expect(details.sourceIp).toBe(false);
    expect(details.destIp).toBe(false);
    expect(details.sourcePort).toBe(false);
    expect(details.destPort).toBe(false);
    expect(details.protocol).toBe(false);
    expect(details.payloadMatches).toEqual([]);
  });

  it('should match source IP correctly', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      sourceIp: { ip: '192.168.1.1', isCidr: false },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.sourceIp).toBe(true);
  });

  it('should match destination IP correctly', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      destIp: { ip: '192.168.1.2', isCidr: false },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.destIp).toBe(true);
  });

  it('should match source port correctly', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      sourcePort: { port: 80 },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.sourcePort).toBe(true);
  });

  it('should match destination port correctly', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      destPort: { port: 443 },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.destPort).toBe(true);
  });

  it('should match protocol correctly', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      protocol: { protocol: 'HTTP' },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.protocol).toBe(true);
  });

  it('should find payload matches with correct offsets', () => {
    const packet = createTestPacket({
      rawData: new TextEncoder().encode('test payload content with test again').buffer
    });
    const criteria: MultiSearchCriteria = {
      payload: { content: 'test', caseSensitive: false },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.payloadMatches.length).toBe(2);
    expect(details.payloadMatches[0].offset).toBe(0);
    expect(details.payloadMatches[0].length).toBe(4);
    expect(details.payloadMatches[1].offset).toBe(26);
    expect(details.payloadMatches[1].length).toBe(4);
  });

  it('should handle case-sensitive payload matching', () => {
    const packet = createTestPacket({
      rawData: new TextEncoder().encode('Test test TEST').buffer
    });
    const criteria: MultiSearchCriteria = {
      payload: { content: 'test', caseSensitive: true },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.payloadMatches.length).toBe(1); // Only matches 'test', not 'Test' or 'TEST'
    expect(details.payloadMatches[0].offset).toBe(5);
  });

  it('should handle multiple criteria matches', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      sourceIp: { ip: '192.168.1.1', isCidr: false },
      destPort: { port: 443 },
      protocol: { protocol: 'HTTP' },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.sourceIp).toBe(true);
    expect(details.destPort).toBe(true);
    expect(details.protocol).toBe(true);
  });

  it('should handle no matches when criteria do not match', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      sourceIp: { ip: '10.0.0.1', isCidr: false },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.sourceIp).toBe(false);
  });

  it('should handle empty payload search string', () => {
    const packet = createTestPacket();
    const criteria: MultiSearchCriteria = {
      payload: { content: '', caseSensitive: false },
      logic: 'AND'
    };

    const details = getMatchDetails(packet, criteria);
    expect(details.payloadMatches).toEqual([]);
  });
});
