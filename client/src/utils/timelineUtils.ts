
import type { ParsedPacket } from '../types';
import type { TimelineDataPoint } from '../types/timeline';

export const generateTimelineData = (packets: ParsedPacket[]): TimelineDataPoint[] => {
    if (!packets || packets.length === 0) {
        return [];
    }

    const buckets: { [key: number]: { count: number; threatCount: number } } = {};

    packets.forEach((packet) => {
        // Validate timestamp
        if (typeof packet.timestamp !== 'number' || isNaN(packet.timestamp)) {
            return;
        }

        // Round down to the nearest second (1000ms)
        const bucketTime = Math.floor(packet.timestamp / 1000) * 1000;

        if (!buckets[bucketTime]) {
            buckets[bucketTime] = { count: 0, threatCount: 0 };
        }

        buckets[bucketTime].count++;

        // Count threats
        // Assuming packet interface has suspiciousIndicators or threatIntelligence
        // We need to cast or inspect types more closely if Typescript complains. 
        // Packet interface in types/packet.ts has optional suspiciousIndicators: string[]
        const hasThreat = (packet.suspiciousIndicators && packet.suspiciousIndicators.length > 0) ||
            (packet.threatIntelligence && packet.threatIntelligence.length > 0);

        if (hasThreat) {
            buckets[bucketTime].threatCount++;
        }
    });

    const sortedTimestamps = Object.keys(buckets)
        .map(Number)
        .sort((a, b) => a - b);

    return sortedTimestamps.map((timestamp) => {
        const total = buckets[timestamp].count;
        const threats = buckets[timestamp].threatCount;
        return {
            timestamp,
            count: total,
            threatCount: threats,
            normalCount: total - threats,
        };
    });
};
