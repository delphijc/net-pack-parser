import { useEffect, useRef } from 'react';
import { usePerformanceStore } from '../store/performanceStore';

export const useTrendRecorder = (intervalMs = 5000) => {
  const { metrics, score, addHistoryPoint } = usePerformanceStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use a ref to access latest state inside interval without resetting it
  const stateRef = useRef({ metrics, score, addHistoryPoint });
  useEffect(() => {
    stateRef.current = { metrics, score, addHistoryPoint };
  }, [metrics, score, addHistoryPoint]);

  useEffect(() => {
    const recordPoint = () => {
      const { metrics, score, addHistoryPoint } = stateRef.current;
      const timestamp = Date.now();

      const metricValues: Record<string, number> = {};
      Object.values(metrics).forEach((m) => {
        metricValues[m.name] = m.value;
      });

      addHistoryPoint({
        timestamp,
        metrics: metricValues,
        score,
      });
    };

    timerRef.current = setInterval(recordPoint, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs]);
};
