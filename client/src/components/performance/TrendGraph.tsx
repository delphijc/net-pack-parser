import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { usePerformanceStore } from '../../store/performanceStore';
import { type TimeRange } from './TrendControls';

interface TrendGraphProps {
  range: TimeRange;
}

export const TrendGraph = ({ range }: TrendGraphProps) => {
  const { metricHistory } = usePerformanceStore();

  const filteredData = useMemo(() => {
    if (range === 'all') return metricHistory;

    // eslint-disable-next-line react-compiler/react-compiler
    const now = Date.now();
    const duration = range === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;
    const startTime = now - duration;

    return metricHistory.filter((point) => point.timestamp >= startTime);
  }, [metricHistory, range]);

  const formattedData = useMemo(() => {
    return filteredData.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      timestamp: point.timestamp,
      Score: point.score,
      LCP: point.metrics['LCP'] || 0,
      CLS: point.metrics['CLS'] ? point.metrics['CLS'] * 1000 : 0, // Scale CLS for visibility if needed, or keep raw
      INP: point.metrics['INP'] || 0,
      FCP: point.metrics['FCP'] || 0,
      TTFB: point.metrics['TTFB'] || 0,
    }));
  }, [filteredData]);

  if (formattedData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No trend data available yet...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis
          dataKey="time"
          stroke="#888"
          tick={{ fontSize: 12 }}
          minTickGap={30}
        />
        <YAxis stroke="#888" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Score"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="LCP"
          stroke="#3b82f6"
          strokeWidth={1}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="TTFB"
          stroke="#f97316"
          strokeWidth={1}
          dot={false}
        />
        {/* Add more lines as needed, keeping graph readable */}
      </LineChart>
    </ResponsiveContainer>
  );
};
