import React, { useState, useEffect, useRef } from 'react';
import { useLiveStore } from '@/store/liveStore';
import { TimelineChart } from './TimelineChart';
import type { TimelineDataPoint } from '@/types/timeline';
import type { PacketData } from '@/types/WebSocketMessages';

/**
 * Convert PacketData[] from liveStore to TimelineDataPoint[].
 */
function generateLiveTimelineData(packets: PacketData[]): TimelineDataPoint[] {
    if (!packets || packets.length === 0) return [];

    const buckets: Record<number, { count: number; threatCount: number }> = {};

    packets.forEach((pkt) => {
        const bucketTime = Math.floor(pkt.timestamp / 1000) * 1000;

        if (!buckets[bucketTime]) {
            buckets[bucketTime] = { count: 0, threatCount: 0 };
        }

        buckets[bucketTime].count++;

        if (pkt.severity && pkt.severity !== 'low') {
            buckets[bucketTime].threatCount++;
        }
    });

    const sortedTimestamps = Object.keys(buckets).map(Number).sort((a, b) => a - b);

    return sortedTimestamps.map((ts) => ({
        timestamp: ts,
        count: buckets[ts].count,
        threatCount: buckets[ts].threatCount,
        normalCount: buckets[ts].count - buckets[ts].threatCount,
    }));
}

export const LiveTimelineView: React.FC = () => {
    const packets = useLiveStore((s) => s.packets);
    const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
    const lastUpdateRef = useRef<number>(0);
    const THROTTLE_MS = 1000; // Update at most once per second

    useEffect(() => {
        const now = Date.now();
        if (now - lastUpdateRef.current >= THROTTLE_MS) {
            lastUpdateRef.current = now;
            setTimelineData(generateLiveTimelineData(packets));
        } else {
            // Schedule an update after remaining time
            const timeout = setTimeout(() => {
                lastUpdateRef.current = Date.now();
                setTimelineData(generateLiveTimelineData(packets));
            }, THROTTLE_MS - (now - lastUpdateRef.current));
            return () => clearTimeout(timeout);
        }
    }, [packets]);

    return (
        <div className="flex-shrink-0">
            <h3 className="text-sm font-medium mb-2">Live Timeline</h3>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 h-[120px]">
                <TimelineChart
                    data={timelineData}
                />
            </div>
        </div>
    );
};
