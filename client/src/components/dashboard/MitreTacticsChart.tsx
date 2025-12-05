import React from 'react';
import type { ThreatAlert } from '../../types/threat';
import { mitreService } from '../../services/mitreService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface MitreTacticsChartProps {
  threats: ThreatAlert[];
}

export const MitreTacticsChart: React.FC<MitreTacticsChartProps> = ({
  threats,
}) => {
  const distribution = mitreService.getTacticsDistribution(threats);
  const data = Object.entries(distribution).map(([tactic, count]) => ({
    tactic,
    count,
  }));

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border h-[300px]">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        MITRE ATT&CK Tactics
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            dataKey="tactic"
            type="category"
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
