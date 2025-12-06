import { useEffect, useRef } from 'react';
import { usePerformanceStore, type LongTask, type ResourceTiming } from '../store/performanceStore';

export const usePerformanceObserver = () => {
  const addLongTask = usePerformanceStore((state) => state.addLongTask);
  const addResource = usePerformanceStore((state) => state.addResource);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // Check for browser support
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not supported in this browser.');
      return;
    }

    try {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Handle Long Tasks
          if (entry.entryType === 'longtask') {
            // Cast to any to access attribution, as it's not always in the standard Typescript lib definitions depending on version
            // Or utilize PerformanceLongTaskTiming interface if available
            const longTaskEntry = entry as PerformanceEntry & {
              checkType?: string;
              attribution?: any[];
            };

            let attribution = 'Unknown';
            if (
              longTaskEntry.attribution &&
              longTaskEntry.attribution.length > 0
            ) {
              const attr = longTaskEntry.attribution[0];
              attribution =
                attr.containerSrc ||
                attr.containerId ||
                attr.containerName ||
                attr.name ||
                'Script';
            }

            const task: LongTask = {
              id: crypto.randomUUID(),
              startTime: entry.startTime,
              duration: entry.duration,
              attribution: attribution,
              timestamp: Date.now(),
            };

            addLongTask(task);
          }

          // Handle Resource Timing
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;

            // Basic filtering: ignore own API calls if checking performance of external stuff, 
            // but for a parser tool, we likely want to see everything including chunk loads.
            // We can filter extremely fast internal things if needed, but for now capture all.

            const resource: ResourceTiming = {
              id: crypto.randomUUID(),
              name: resourceEntry.name,
              initiatorType: resourceEntry.initiatorType,
              startTime: resourceEntry.startTime,
              duration: resourceEntry.duration,
              transferSize: resourceEntry.transferSize,
              breakdown: {
                dns: resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart,
                tcp: resourceEntry.connectEnd - resourceEntry.connectStart,
                ttfb: resourceEntry.responseStart - resourceEntry.requestStart,
                download: resourceEntry.responseEnd - resourceEntry.responseStart,
              },
            };

            addResource(resource);
          }
        });
      });

      observerRef.current.observe({ entryTypes: ['longtask', 'resource'] });
    } catch (e) {
      console.warn('PerformanceObserver failed to start:', e);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [addLongTask, addResource]);
};
