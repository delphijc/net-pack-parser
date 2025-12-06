import { useEffect } from 'react';
import { onLCP, onFCP, onCLS, onINP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import {
  usePerformanceStore,
  type Metric as StoreMetric,
} from '../store/performanceStore';

export const useWebVitals = () => {
  const updateMetric = usePerformanceStore((state) => state.updateMetric);

  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      // web-vitals rating provides 'good' | 'needs-improvement' | 'poor'
      const storeMetric: StoreMetric = {
        name: metric.name as StoreMetric['name'],
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      };
      updateMetric(storeMetric);
    };

    onLCP(handleMetric);
    onFCP(handleMetric);
    onCLS(handleMetric);
    onINP(handleMetric);
    onTTFB(handleMetric);
  }, [updateMetric]);
};
