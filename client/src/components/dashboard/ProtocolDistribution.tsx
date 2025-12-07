import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { BarChart3 } from 'lucide-react';
import type { ParsedPacket } from '../../types';

interface ProtocolDistributionProps {
  packets: ParsedPacket[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#A28DFF',
  '#FF69B4',
  '#8A2BE2',
  '#40E0D0',
];

export const ProtocolDistribution: React.FC<ProtocolDistributionProps> = ({
  packets,
}) => {
  const protocolCounts = packets.reduce(
    (acc, packet) => {
      // Use detectedProtocols if available, otherwise fallback to protocol field
      if (packet.detectedProtocols && packet.detectedProtocols.length > 0) {
        packet.detectedProtocols.forEach((protocol: string) => {
          acc[protocol] = (acc[protocol] || 0) + 1;
        });
      } else {
        const proto = packet.protocol || 'Unknown';
        acc[proto] = (acc[proto] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const data = Object.entries(protocolCounts)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value); // Sort by count desc

  return (
    <ChartWrapper
      title={
        <>
          <BarChart3 size={18} className="mr-2 text-primary" />
          Protocol Distribution
        </>
      }
      className="h-full"
      contentClassName="h-[300px]"
    >
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No protocol data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="rgba(255,255,255,0.1)"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
};
