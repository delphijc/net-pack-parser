import { VitalsCard } from './VitalsCard';
import { ServerMonitor } from './ServerMonitor';
import type { Metric } from '../../store/performanceStore';

interface MetricSummaryProps {
  getMetric: (name: string) => Metric;
  definitions: Record<string, string>;
}

export const MetricSummary = ({
  getMetric,
  definitions,
}: MetricSummaryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ServerMonitor />
      <VitalsCard metric={getMetric('LCP')} description={definitions['LCP']} />
      <VitalsCard metric={getMetric('CLS')} description={definitions['CLS']} />
      <VitalsCard metric={getMetric('INP')} description={definitions['INP']} />
      <VitalsCard metric={getMetric('FCP')} description={definitions['FCP']} />
      <VitalsCard
        metric={getMetric('TTFB')}
        description={definitions['TTFB']}
      />
    </div>
  );
};
