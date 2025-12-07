import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge = ({ score }: ScoreGaugeProps) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  let color = '#22c55e'; // Green
  let status = 'Good';
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
    'default';

  if (score < 50) {
    color = '#ef4444'; // Red
    status = 'Poor';
    badgeVariant = 'destructive';
  } else if (score < 90) {
    color = '#f97316'; // Orange
    status = 'Needs Improvement';
    badgeVariant = 'secondary'; // Using secondary for orange-ish warning state
  }

  return (
    <div className="h-full min-h-[160px] bg-card rounded-lg border shadow-sm p-4 flex flex-col items-center justify-center relative">
      <div className="w-full h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              startAngle={180}
              endAngle={0}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell key="score" fill={color} />
              <Cell
                key="remaining"
                fill="#e5e7eb"
                className="dark:fill-slate-800"
              />
              <Label
                value={score}
                position="center"
                fill={color}
                className="text-3xl font-bold"
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-sm font-medium mt-[-10px] text-muted-foreground">
        Performance Score
      </div>
      <Badge variant={badgeVariant} className="mt-2 text-xs px-2 py-0.5">
        {status}
      </Badge>
    </div>
  );
};
