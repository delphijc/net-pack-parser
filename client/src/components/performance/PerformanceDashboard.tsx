import { useState, useMemo } from 'react';
import { usePerformanceStore } from '../../store/performanceStore';
import { ScoreGauge } from './ScoreGauge';
import { VitalsCard } from './VitalsCard';
import { NavigationTimingView } from './NavigationTimingView';
import { LongTasksView } from './LongTasksView';
import { WaterfallChart } from './WaterfallChart';
import { TrendGraph } from './TrendGraph';
import { TrendControls, type TimeRange } from './TrendControls';
import { usePerformanceObserver } from '../../hooks/usePerformanceObserver';
import { useTrendRecorder } from '../../hooks/useTrendRecorder';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

import { usePerformanceFilter } from '../../hooks/usePerformanceFilter';
import { PerformanceFilters } from './PerformanceFilters';

import { CsvExporter } from '@/services/Exporters/CsvExporter';

export const PerformanceDashboard = () => {
  const { metrics, score, longTasks, resources, resetMetrics, metricHistory } =
    usePerformanceStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('5m');

  const {
    resourceType,
    setResourceType,
    domain,
    setDomain,
    minDuration,
    setMinDuration,
    filterResources,
    filterLongTasks,
  } = usePerformanceFilter();

  const filteredResources = useMemo(
    () => filterResources(resources),
    [resources, filterResources],
  );
  const filteredLongTasks = useMemo(
    () => filterLongTasks(longTasks),
    [longTasks, filterLongTasks],
  );

  // Initialize observers
  usePerformanceObserver();
  useTrendRecorder();

  const getMetric = (name: string) =>
    metrics[name] || { name, value: 0, rating: 'good', delta: 0, id: '' };

  const definitions = {
    LCP: 'Largest Contentful Paint: Measures loading performance.',
    FCP: 'First Contentful Paint: Measures load start.',
    CLS: 'Cumulative Layout Shift: Measures visual stability.',
    INP: 'Interaction to Next Paint: Measures interactivity.',
    TTFB: 'Time to First Byte: Measures server response time.',
  };

  const handleExport = () => {
    const data = {
      score,
      metrics,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen text-foreground">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          performance dashboard
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetMetrics}
            title="Reset Metrics"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              title="Export Report (JSON)"
            >
              <Download className="h-4 w-4 mr-2" />
              Report (JSON)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => CsvExporter.exportPerformanceMetrics(metricHistory)}
              title="Export Metrics (CSV)"
            >
              <Download className="h-4 w-4 mr-2" />
              Metrics (CSV)
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 border shadow-sm">
        <PerformanceFilters
          resourceType={resourceType}
          onResourceTypeChange={setResourceType}
          domain={domain}
          onDomainChange={setDomain}
          minDuration={minDuration}
          onMinDurationChange={setMinDuration}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-1">
          <ScoreGauge score={score} />
        </div>
        <VitalsCard metric={getMetric('LCP')} description={definitions.LCP} />
        <VitalsCard metric={getMetric('CLS')} description={definitions.CLS} />
        <VitalsCard metric={getMetric('INP')} description={definitions.INP} />
        <VitalsCard metric={getMetric('TTFB')} description={definitions.TTFB} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <NavigationTimingView />
          <div className="bg-card rounded-lg p-4 border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Performance Trends</h3>
              <TrendControls range={timeRange} onRangeChange={setTimeRange} />
            </div>
            <div className="h-[300px]">
              <TrendGraph range={timeRange} />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <LongTasksView tasks={filteredLongTasks} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Resource Waterfall</h3>
        <WaterfallChart resources={filteredResources} />
      </div>
    </div>
  );
};
