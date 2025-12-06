import { useState, useEffect } from 'react';

export interface NavigationTimingMetrics {
    // Total load time
    loadTime: number;
    // Network phases
    dns: number;
    tcp: number;
    request: number;
    response: number;
    // Processing phases
    domProcessing: number;
    domComplete: number;
    loadEvent: number;

    // Timestamps relative to navigation start
    ttfb: number;
}

export interface NavigationTimingState {
    metrics: NavigationTimingMetrics | null;
    entry: PerformanceNavigationTiming | null;
    isSupported: boolean;
}

export const useNavigationTiming = (): NavigationTimingState => {
    const [state, setState] = useState<NavigationTimingState>({
        metrics: null,
        entry: null,
        isSupported: typeof window !== 'undefined' && !!window.performance && 'getEntriesByType' in window.performance,
    });

    useEffect(() => {
        if (!state.isSupported) return;

        const updateTiming = () => {
            // We look for 'navigation' entries. 
            // Level 2 spec: performance.getEntriesByType('navigation')
            const entries = performance.getEntriesByType('navigation');

            if (entries.length > 0) {
                const entry = entries[0] as PerformanceNavigationTiming;

                // Calculate phase durations. handling potential 0s or missing data safely
                // Durations are end - start. If end is 0 (check didn't happen potentially), duration might be weird, 
                // but typically 0 start/end means it wasn't captured or wasn't applicable (e.g. reused connection).
                // We use Math.max(0, ...) to ensure no negative numbers if clocks drift slightly or logic is odd.

                const metrics: NavigationTimingMetrics = {
                    loadTime: entry.loadEventEnd > 0 ? entry.loadEventEnd : entry.responseEnd, // fallback if load event hasn't fired yet? 
                    // In a hook called after load, loadEventEnd should be present.

                    dns: Math.max(0, entry.domainLookupEnd - entry.domainLookupStart),
                    tcp: Math.max(0, entry.connectEnd - entry.connectStart),
                    request: Math.max(0, entry.responseStart - entry.requestStart),
                    response: Math.max(0, entry.responseEnd - entry.responseStart),

                    domProcessing: Math.max(0, entry.domComplete - entry.domInteractive),
                    domComplete: entry.domComplete,
                    loadEvent: Math.max(0, entry.loadEventEnd - entry.loadEventStart),

                    ttfb: entry.responseStart,
                };

                setState({
                    metrics,
                    entry,
                    isSupported: true,
                });
            }
        };

        // Check immediately in case we are already loaded
        if (document.readyState === 'complete') {
            updateTiming();
        }

        // Also listen for load event if we are early
        window.addEventListener('load', () => {
            // use setTimeout to let the event loop clear and ensure timing entries are populated
            setTimeout(updateTiming, 0);
        });

        return () => {
            window.removeEventListener('load', updateTiming);
        }
    }, [state.isSupported]);

    return state;
};
