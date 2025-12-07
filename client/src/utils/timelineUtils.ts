
import type { Packet } from '../types/packet';
import type { TimelineDataPoint } from '../types/timeline';

export const generateTimelineData = (packets: Packet[]): TimelineDataPoint[] => {
    if (!packets || packets.length === 0) {
        return [];
    }

    const buckets: { [key: number]: number } = {};

    packets.forEach((packet) => {
        // Validate timestamp
        if (typeof packet.timestamp !== 'number' || isNaN(packet.timestamp)) {
            return;
        }

        // Round down to the nearest second (1000ms)
        const bucketTime = Math.floor(packet.timestamp / 1000) * 1000;
        buckets[bucketTime] = (buckets[bucketTime] || 0) + 1;
    });

    const sortedTimestamps = Object.keys(buckets)
        .map(Number)
        .sort((a, b) => a - b);

    return sortedTimestamps.map((timestamp) => ({
        timestamp,
        count: buckets[timestamp],
    }));
};
