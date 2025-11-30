// client/src/components/ProtocolDistributionChart.tsx
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtocolDistributionChartProps {
  packets: any[]; // Expecting an array of packets with detectedProtocols
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

export const ProtocolDistributionChart: React.FC<
  ProtocolDistributionChartProps
> = ({ packets }) => {
  const protocolCounts = packets.reduce((acc, packet) => {
    packet.detectedProtocols.forEach((protocol: string) => {
      acc[protocol] = (acc[protocol] || 0) + 1;
    });
    return acc;
  }, {});

  const data = Object.entries(protocolCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Protocol Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        {' '}
        {/* Adjust height to fit chart */}
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
                outerRadius={80}
                fill="#8884d8"
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
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
