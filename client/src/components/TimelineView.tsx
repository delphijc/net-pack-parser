import React, { useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Packet } from '../types/packet';
import { TimelineChart } from './TimelineChart';
import { generateTimelineData } from '../utils/timelineUtils';
import { useTimelineStore } from '../store/timelineStore';

interface TimelineViewProps {
    packets: Packet[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ packets }) => {
    const { startTime, endTime, setRange, resetRange } = useTimelineStore();

    const timelineData = useMemo(() => {
        return generateTimelineData(packets);
    }, [packets]);

    // Calculate indices based on store timestamps
    const startIndex = useMemo(() => {
        if (startTime === null) return undefined;
        const idx = timelineData.findIndex(d => d.timestamp >= startTime);
        return idx !== -1 ? idx : 0;
    }, [timelineData, startTime]);

    const endIndex = useMemo(() => {
        if (endTime === null) return undefined;
        // Find index of first item > endTime, then subtract 1? 
        // Or find item with timestamp <= endTime.
        // Brush endIndex is inclusive.
        // Let's iterate backwards or findIndex.
        // Simple approach: findIndex of exact or closest match?
        // Let's assume buckets are sorted.
        let idx = -1;
        for (let i = timelineData.length - 1; i >= 0; i--) {
            if (timelineData[i].timestamp <= endTime) {
                idx = i;
                break;
            }
        }
        return idx !== -1 ? idx : timelineData.length - 1;
    }, [timelineData, endTime]);

    const handleRangeChange = (start: number | null, end: number | null) => {
        setRange(start, end);
    };

    const handleZoom = (direction: 'in' | 'out') => {
        if (timelineData.length === 0) return;

        let currentStartIdx = startIndex ?? 0;
        let currentEndIdx = endIndex ?? timelineData.length - 1;

        const range = currentEndIdx - currentStartIdx;
        const step = Math.max(1, Math.floor(range * 0.2)); // 20% zoom

        if (direction === 'in') {
            currentStartIdx = Math.min(currentStartIdx + step, currentEndIdx - 2); // Keep at least 2 bars
            currentEndIdx = Math.max(currentEndIdx - step, currentStartIdx + 2);
        } else {
            currentStartIdx = Math.max(0, currentStartIdx - step);
            currentEndIdx = Math.min(timelineData.length - 1, currentEndIdx + step);
        }

        const newStartTime = timelineData[currentStartIdx].timestamp;
        const newEndTime = timelineData[currentEndIdx].timestamp;
        setRange(newStartTime, newEndTime);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Timeline Analysis</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">
                        {packets.length} packets / {timelineData.length} intervals
                    </span>
                    <Button variant="outline" size="icon" onClick={() => handleZoom('in')} title="Zoom In">
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleZoom('out')} title="Zoom Out">
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={resetRange} title="Reset">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                    <TimelineChart
                        data={timelineData}
                        startIndex={startIndex}
                        endIndex={endIndex}
                        onRangeChange={handleRangeChange}
                    />
                </div>
            </div>
        </div>
    );
};
