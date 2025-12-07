import React, { useMemo } from 'react';
import type { Packet } from '../types/packet';
import { TimelineChart } from './TimelineChart';
import { generateTimelineData } from '../utils/timelineUtils';

interface TimelineViewProps {
    packets: Packet[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ packets }) => {
    const timelineData = useMemo(() => {
        return generateTimelineData(packets);
    }, [packets]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Timeline Analysis</h3>
                <div className="text-sm text-muted-foreground">
                    {packets.length} packets / {timelineData.length} intervals
                </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                    <TimelineChart data={timelineData} />
                </div>
            </div>
        </div>
    );
};
