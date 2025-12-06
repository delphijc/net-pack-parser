import { usePerformanceStore } from '../../store/performanceStore';
import { ScoreGauge } from './ScoreGauge';
import { VitalsCard } from './VitalsCard';
import { NavigationTimingView } from './NavigationTimingView';
import { LongTasksView } from './LongTasksView';
import { ServerMonitor } from './ServerMonitor';
import { WaterfallChart } from './WaterfallChart';
import { usePerformanceObserver } from '../../hooks/usePerformanceObserver';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const PerformanceDashboard = () => {
  const { metrics, score, resetMetrics } = usePerformanceStore();

  // Initialize observers
  usePerformanceObserver();

  const getMetric = (name: string) =>
    metrics[name] || { name, value: 0, rating: 'good', delta: 0, id: '' };

  const definitions = {
    LCP: 'Largest Contentful Paint: Measures loading performance.',
    FCP: 'First Contentful Paint: Measures load start.',
    CLS: 'Cumulative Layout Shift: Measures visual stability.',
    INP: 'Interaction to Next Paint: Measures interactivity.',
    TTFB: 'Time to First Byte: Measures server response time.',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Performance Monitoring
        </h2>
        <Button variant="outline" size="sm" onClick={resetMetrics}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Metrics
        </Button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-2">
          <div className="rounded-xl border bg-card text-card-foreground shadow h-full p-6 flex items-center justify-center">
            <ScoreGauge score={score} />
          </div>
        </div>
        <div className="col-span-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ServerMonitor />
          <VitalsCard
            metric={getMetric('LCP')}
            description={definitions['LCP']}
          />
          <VitalsCard
            metric={getMetric('CLS')}
            description={definitions['CLS']}
          />
          <VitalsCard
            metric={getMetric('INP')}
            description={definitions['INP']}
          />
          <VitalsCard
            metric={getMetric('FCP')}
            description={definitions['FCP']}
          />
          <VitalsCard
            metric={getMetric('TTFB')}
            description={definitions['TTFB']}
          />
        </div>
      </div>

      {/* Navigation Timing and Long Tasks Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <NavigationTimingView />
        </div>
        <div className="md:col-span-1">
          <LongTasksView />
        </div>
      </div>

      {/* Resource Waterfall */}
      <div className="h-[400px]">
        <WaterfallChart />
      </div>
    </div>
  );
};
