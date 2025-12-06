import { useEffect, useRef } from 'react';
import { usePerformanceStore, type LongTask } from '../store/performanceStore';

export const usePerformanceObserver = () => {
    const addLongTask = usePerformanceStore((state) => state.addLongTask);
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
                    // We only care about long tasks (though we specify entryTypes below)
                    if (entry.entryType === 'longtask') {
                        // Cast to any to access attribution, as it's not always in the standard Typescript lib definitions depending on version
                        // Or utilize PerformanceLongTaskTiming interface if available
                        const longTaskEntry = entry as PerformanceEntry & { checkType?: string; attribution?: any[] };

                        let attribution = 'Unknown';
                        if (longTaskEntry.attribution && longTaskEntry.attribution.length > 0) {
                            const attr = longTaskEntry.attribution[0];
                            attribution = attr.containerSrc || attr.containerId || attr.containerName || attr.name || 'Script';
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
                });
            });

            observerRef.current.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.warn('PerformanceObserver failed to start:', e);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [addLongTask]);
};
