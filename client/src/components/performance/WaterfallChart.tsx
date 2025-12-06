import { useMemo } from 'react';
import {
  usePerformanceStore,
  type ResourceTiming,
} from '../../store/performanceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WaterfallChartProps {
  resources?: ResourceTiming[];
}

export const WaterfallChart = ({ resources }: WaterfallChartProps) => {
  const storeResources = usePerformanceStore((state) => state.resources);
  // If resources are passed (filtered), use them. Otherwise default to all from store.
  const displayResources = resources || storeResources;

  // Determine scale
  const startTime = 0;
  const endTime = useMemo(() => {
    return Math.max(
      ...displayResources.map((r) => r.startTime + r.duration),
      1000, // Minimum 1s view
    );
  }, [displayResources]);

  const totalDuration = endTime - startTime;

  const getPercent = (value: number) => {
    return (value / totalDuration) * 100;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Resource Waterfall
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] p-0">
        <div className="flex flex-col h-full">
          {/* Timeline Header */}
          <div className="h-6 flex border-b text-xs text-muted-foreground relative mx-4">
            {/* Simplified markers */}
            <span className="absolute left-0">0ms</span>
            <span className="absolute left-1/4">
              {(totalDuration * 0.25).toFixed(0)}ms
            </span>
            <span className="absolute left-1/2">
              {(totalDuration * 0.5).toFixed(0)}ms
            </span>
            <span className="absolute left-3/4">
              {(totalDuration * 0.75).toFixed(0)}ms
            </span>
            <span className="absolute right-0">
              {totalDuration.toFixed(0)}ms
            </span>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {displayResources.map((res) => {
                const startPercent = getPercent(res.startTime);
                const widthPercent = Math.max(getPercent(res.duration), 0.5); // Min 0.5% width visibility

                return (
                  <div
                    key={res.id}
                    className="flex items-center text-xs group relative h-6"
                  >
                    <div className="w-1/4 truncate pr-2" title={res.name}>
                      {res.name.split('/').pop()}
                    </div>
                    <div className="flex-1 h-full relative bg-muted/20">
                      <div
                        className="absolute h-4 top-1 bg-primary/80 rounded"
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        title={`${res.name}\nStart: ${res.startTime.toFixed(0)}ms\nDuration: ${res.duration.toFixed(0)}ms\nBreakdown:\nDNS: ${res.breakdown.dns.toFixed(0)}\nTCP: ${res.breakdown.tcp.toFixed(0)}\nTTFB: ${res.breakdown.ttfb.toFixed(0)}\nDownload: ${res.breakdown.download.toFixed(0)}`}
                      >
                        {/* Inner segments for Breakdown could go here if enough width */}
                      </div>
                    </div>
                  </div>
                );
              })}
              {displayResources.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No resources captured yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
