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
  ReferenceLine,
} from 'recharts';
import type { TimelineDataPoint } from '../types/timeline';
import type { Bookmark } from '../types/forensics';

interface TimelineChartProps {
  data?: TimelineDataPoint[]; // Original raw data structure
  aggregatedData?: { key_as_string: string; doc_count: number; threat_packets?: { doc_count: number } }[]; // Server aggregated
  startIndex?: number;
  endIndex?: number;
  onRangeChange?: (start: number | null, end: number | null) => void;
  bookmarks?: Bookmark[];
  onPlotClick?: (timestamp: number) => void;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  aggregatedData,
  startIndex,
  endIndex,
  onRangeChange,
  bookmarks = [],
  onPlotClick,
}) => {
  // Use aggregated data if available, otherwise fall back to raw data logic
  const chartData = React.useMemo(() => {
    if (aggregatedData) {
      return aggregatedData.map(item => ({
        timestamp: new Date(item.key_as_string).getTime(),
        normalCount: (item.doc_count || 0) - (item.threat_packets?.doc_count || 0),
        threatCount: item.threat_packets?.doc_count || 0,
        totalCount: item.doc_count
      })).sort((a, b) => a.timestamp - b.timestamp);
    }
    return data || [];
  }, [aggregatedData, data]);

  if (!chartData || chartData.length === 0) {
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
    if (
      onRangeChange &&
      range.startIndex !== undefined &&
      range.endIndex !== undefined
    ) {
      const start = chartData[range.startIndex]?.timestamp || null;
      const end = chartData[range.endIndex]?.timestamp || null;
      onRangeChange(start, end);
    }
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
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
          <Bar
            dataKey="normalCount"
            stackId="a"
            fill="#3b82f6"
            radius={[0, 0, 0, 0]} // Bottom bar
            onClick={(data: any) => {
              if (data && data.payload && data.payload.timestamp) {
                onPlotClick?.(data.payload.timestamp);
              }
            }}
            cursor="pointer"
            name="Normal Traffic"
          />
          <Bar
            dataKey="threatCount"
            stackId="a"
            fill="#ef4444" // Tailwind red-500
            radius={[4, 4, 0, 0]} // Top bar gets radius
            onClick={(data: any) => {
              if (data && data.payload && data.payload.timestamp) {
                onPlotClick?.(data.payload.timestamp);
              }
            }}
            cursor="pointer"
            name="Threats"
          />
          {bookmarks.map((bookmark) => (
            <ReferenceLine
              key={bookmark.id}
              x={bookmark.timestamp}
              stroke="red"
              strokeDasharray="3 3"
              label={{
                position: 'top',
                value: '🚩',
                fill: 'red',
                fontSize: 14,
              }}
            />
          ))}
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
