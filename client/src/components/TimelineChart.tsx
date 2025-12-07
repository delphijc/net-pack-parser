import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Brush,
} from 'recharts';
import type { TimelineDataPoint } from '../types/timeline';

interface TimelineChartProps {
    data: TimelineDataPoint[];
    startIndex?: number;
    endIndex?: number;
    onRangeChange?: (start: number | null, end: number | null) => void;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({
    data,
    startIndex,
    endIndex,
    onRangeChange
}) => {
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

    const handleBrushChange = (range: any) => {
        if (onRangeChange && range.startIndex !== undefined && range.endIndex !== undefined) {
            const start = data[range.startIndex]?.timestamp || null;
            const end = data[range.endIndex]?.timestamp || null;
            onRangeChange(start, end);
        }
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
                    <Brush
                        dataKey="timestamp"
                        height={30}
                        stroke="#3b82f6"
                        startIndex={startIndex}
                        endIndex={endIndex}
                        onChange={handleBrushChange}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
