import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { TimelineDataPoint } from '../types/timeline';

interface TimelineChartProps {
    data: TimelineDataPoint[];
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center rounded-md border border-dashed text-muted-foreground">
                No timeline data available
            </div>
        );
    }

    const formatXAxis = (tickItem: number) => {
        return new Date(tickItem).toLocaleTimeString();
    };

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatXAxis}
                        minTickGap={30}
                        className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        formatter={(value) => [`${value} packets`, 'Count']}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
