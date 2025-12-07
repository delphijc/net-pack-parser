
import { describe, it, expect } from 'vitest';
import { generateTimelineData } from './timelineUtils';
import { Packet } from '../types/packet';
import { TimelineDataPoint } from '../types/timeline';

describe('timelineUtils', () => {
    it('should aggregate packets into 1-second buckets', () => {
        const packets: Packet[] = [
            { timestamp: 1000, id: '1', length: 60, protocol: 'TCP', sourceIp: '1.2.3.4', destinationIp: '5.6.7.8', sourcePort: 80, destinationPort: 12345 },
            { timestamp: 1000, id: '2', length: 60, protocol: 'TCP', sourceIp: '1.2.3.4', destinationIp: '5.6.7.8', sourcePort: 80, destinationPort: 12345 }, // Same second
            { timestamp: 2000, id: '3', length: 60, protocol: 'TCP', sourceIp: '1.2.3.4', destinationIp: '5.6.7.8', sourcePort: 80, destinationPort: 12345 }, // Next second
        ] as any; // Cast potential incomplete mock

        const data: TimelineDataPoint[] = generateTimelineData(packets);

        expect(data).toHaveLength(2);
        expect(data[0].timestamp).toBe(1000);
        expect(data[0].count).toBe(2);
        expect(data[1].timestamp).toBe(2000);
        expect(data[1].count).toBe(1);
    });

    it('should handle empty packet list', () => {
        const packets: Packet[] = [];
        const data = generateTimelineData(packets);
        expect(data).toEqual([]);
    });

    it('should fill gaps with zero counts if needed (optional, or pure sparse?)', () => {
        // For now, let's assume we want a sparse list and the chart handles gaps,
        // OR we might want to fill gaps. AC doesn't specify. 
        // Let's assume sparse for now to minimize processing.
    });
});
