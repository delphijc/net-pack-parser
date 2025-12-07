import { describe, it, expect } from 'vitest';
import { generateTimelineData } from './timelineUtils';
import type { ParsedPacket } from '../types';

describe('timelineUtils', () => {
  it('should aggregate packets into 1-second buckets and count threats', () => {
    const packets: ParsedPacket[] = [
      {
        timestamp: 1000,
        id: '1',
        length: 60,
        protocol: 'TCP',
        sourceIP: '1.2.3.4',
        destIP: '5.6.7.8',
        sourcePort: 80,
        destPort: 12345,
        suspiciousIndicators: [],
      } as any,
      {
        timestamp: 1000,
        id: '2',
        length: 60,
        protocol: 'TCP',
        sourceIP: '1.2.3.4',
        destIP: '5.6.7.8',
        sourcePort: 80,
        destPort: 12345,
        suspiciousIndicators: ['SQL Injection'],
      } as any, // Threat
      {
        timestamp: 2000,
        id: '3',
        length: 60,
        protocol: 'TCP',
        sourceIP: '1.2.3.4',
        destIP: '5.6.7.8',
        sourcePort: 80,
        destPort: 12345,
        suspiciousIndicators: [],
      } as any,
    ];

    const data = generateTimelineData(packets);

    expect(data).toHaveLength(2);
    expect(data[0].timestamp).toBe(1000);
    expect(data[0].count).toBe(2);
    expect(data[0].threatCount).toBe(1);
    expect(data[0].normalCount).toBe(1);

    expect(data[1].timestamp).toBe(2000);
    expect(data[1].count).toBe(1);
    expect(data[1].threatCount).toBe(0);
    expect(data[1].normalCount).toBe(1);
  });

  it('should handle empty packet list', () => {
    const packets: ParsedPacket[] = [];
    const data = generateTimelineData(packets);
    expect(data).toEqual([]);
  });
});
