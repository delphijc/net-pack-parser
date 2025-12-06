import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge = ({ score }: ScoreGaugeProps) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  let color = '#22c55e'; // Green
  if (score < 50)
    color = '#ef4444'; // Red
  else if (score < 90) color = '#f97316'; // Orange

  return (
    <div className="h-[200px] w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
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
              className="text-4xl font-bold"
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="text-xl font-semibold mt-[-40px]">Performance Score</div>
    </div>
  );
};
