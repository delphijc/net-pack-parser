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
import { useTheme } from '../theme-provider';

interface MitreTacticsChartProps {
  threats: ThreatAlert[];
}

export const MitreTacticsChart: React.FC<MitreTacticsChartProps> = ({
  threats,
}) => {
  const { theme } = useTheme();
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

  // Axis text color based on theme
  // In system mode, we might not know the exact preference easily without a listener or assumption.
  // Ideally useTheme would expose 'resolvedTheme' but our provider only gives 'dark' | 'light' | 'system'.
  // We'll rely on the CSS variables usually, but Recharts needs explicit JS colors for ticks.
  // A simple heuristic: if theme is 'dark', use light text. If system, we might need to rely on CSS or accept a default.
  // Since we can't easily detect system preference in JS here without extra logic, let's presume basic defaults
  // or use a utility if available. For now, let's guess based on 'theme' state if explicitly set, else default.
  const isDark = theme === 'dark'; 
  const axisColor = isDark ? '#e2e8f0' : '#6b7280'; // slate-200 : gray-500
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'; // slate-800 : white
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
  const tooltipText = isDark ? '#f8fafc' : '#0f172a'; // slate-50 : slate-900

  return (
    <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm border dark:border-border h-[300px]">
      <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">
        MITRE ATT&CK Tactics
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" allowDecimals={false} stroke={axisColor} />
          <YAxis
            dataKey="tactic"
            type="category"
            width={100}
            tick={{ fontSize: 12, fill: axisColor }}
            stroke={axisColor}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              borderColor: tooltipBorder, 
              color: tooltipText,
              borderRadius: '0.375rem'
            }}
            itemStyle={{ color: tooltipText }}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          />
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
