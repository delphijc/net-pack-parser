import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { Users } from 'lucide-react';

// ... (imports remain)
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ParsedPacket } from '../../types';

interface TopTalkersProps {
  packets: ParsedPacket[];
  onFilterClick?: (ip: string, type: 'src' | 'dst') => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export const TopTalkers: React.FC<TopTalkersProps> = ({
  packets,
  onFilterClick,
}) => {
  const { srcData, dstData } = useMemo(() => {
    // ... (memo logic remains same)
    const srcCounts: Record<string, number> = {};
    const dstCounts: Record<string, number> = {};

    packets.forEach((p) => {
      const len = p.length || 0;
      srcCounts[p.sourceIP] = (srcCounts[p.sourceIP] || 0) + len;
      dstCounts[p.destIP] = (dstCounts[p.destIP] || 0) + len;
    });

    const process = (counts: Record<string, number>) =>
      Object.entries(counts)
        .map(([ip, bytes]) => ({ ip, bytes }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 5);

    return {
      srcData: process(srcCounts),
      dstData: process(dstCounts),
    };
  }, [packets]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderChart = (
    data: { ip: string; bytes: number }[],
    type: 'src' | 'dst',
  ) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        onClick={(state: any) => {
          if (state && state.activePayload && state.activePayload.length > 0) {
            const ip = state.activePayload[0].payload.ip;
            onFilterClick?.(ip, type);
          }
        }}
        className="cursor-pointer"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.1)"
          horizontal={false}
        />
        <XAxis type="number" hide />
        <YAxis
          dataKey="ip"
          type="category"
          width={100}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value: number) => [formatBytes(value), 'Volume']}
        />
        <Bar dataKey="bytes" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <ChartWrapper
      title={
        <>
          <Users size={18} className="mr-2 text-primary" />
          Top Talkers
        </>
      }
      className="h-full"
      contentClassName="h-[300px]"
    >
      <Tabs defaultValue="source" className="h-full flex flex-col">
        <div className="px-6 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="source" className="flex-1">
              Source IPs
            </TabsTrigger>
            <TabsTrigger value="dest" className="flex-1">
              Dest IPs
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="source" className="flex-1 min-h-0 px-4 pb-4">
          {srcData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data
            </div>
          ) : (
            renderChart(srcData, 'src')
          )}
        </TabsContent>
        <TabsContent value="dest" className="flex-1 min-h-0 px-4 pb-4">
          {dstData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data
            </div>
          ) : (
            renderChart(dstData, 'dst')
          )}
        </TabsContent>
      </Tabs>
    </ChartWrapper>
  );
};
