import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metric } from '../../store/performanceStore';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';

interface VitalsCardProps {
  metric: Metric;
  description: string;
}

export const VitalsCard = ({ metric, description }: VitalsCardProps) => {
  let colorClass = 'bg-green-500 hover:bg-green-600';
  let textColorClass = 'text-green-500';

  if (metric.rating === 'needs-improvement') {
    colorClass = 'bg-orange-500 hover:bg-orange-600';
    textColorClass = 'text-orange-500';
  } else if (metric.rating === 'poor') {
    colorClass = 'bg-red-500 hover:bg-red-600';
    textColorClass = 'text-red-500';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
        <Badge className={clsx(colorClass)}>{metric.rating}</Badge>
      </CardHeader>
      <CardContent>
        <div className={clsx('text-2xl font-bold', textColorClass)}>
          {Math.round(metric.value)} ms
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};
