import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { Activity } from 'lucide-react';
import type { ParsedPacket } from '../../types';
import { useTimelineStore } from '../../store/timelineStore';

interface TrafficVolumeProps {
  packets: ParsedPacket[];
}

export const TrafficVolume: React.FC<TrafficVolumeProps> = ({ packets }) => {
  const { setRange } = useTimelineStore();

  const data = useMemo(() => {
    if (!packets.length) return [];

    // Determine time range
    const timestamps = packets.map((p) => p.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const durationMs = maxTime - minTime;

    // Determine bucket size
    let bucketSizeMs = 1000; // Default 1s
    if (durationMs > 3600 * 1000) {
      bucketSizeMs = 60 * 1000; // 1 min if > 1 hour
    } else if (durationMs > 60 * 1000 * 10) {
      bucketSizeMs = 10000; // 10s if > 10 min
    }

    const buckets: Record<
      number,
      { time: number; packets: number; bytes: number }
    > = {};

    packets.forEach((p) => {
      const bucketTime = Math.floor(p.timestamp / bucketSizeMs) * bucketSizeMs;
      if (!buckets[bucketTime]) {
        buckets[bucketTime] = { time: bucketTime, packets: 0, bytes: 0 };
      }
      buckets[bucketTime].packets += 1;
      buckets[bucketTime].bytes += p.length || 0;
    });

    return Object.values(buckets).sort((a, b) => a.time - b.time);
  }, [packets]);

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedTime = data.activePayload[0].payload.time;
      // Zoom into this bucket +/- some buffer?
      // Or just center timeline around it?
      // Story says: "Zooming/Filtering this chart updates the core time filter"
      // Let's set a small range around the clicked point, e.g., +/- 5 seconds or whatever the bucket size is.
      // Getting bucket size is tricky here without storing it, but we can approximate.

      // Let's just set start/end to cover this bucket or vicinity.
      // Maybe +/- 30 seconds
      setRange(clickedTime - 30000, clickedTime + 30000);
    }
  };

  const formatXAxis = (tickItem: number) => {
    return new Date(tickItem).toLocaleTimeString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ChartWrapper
      title={
        <>
          <Activity size={18} className="mr-2 text-primary" />
          Traffic Volume Over Time
        </>
      }
      className="h-full"
      contentClassName="h-[300px]"
    >
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No traffic data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} onClick={handleChartClick}>
            <defs>
              <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              minTickGap={30}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(val) => formatBytes(val)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              formatter={(value: number, name: string) => [
                name === 'bytes' ? formatBytes(value) : value,
                name === 'bytes' ? 'Volume' : 'Packets',
              ]}
            />
            <Area
              type="monotone"
              dataKey="bytes"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorBytes)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
};
