import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

export interface Metric {
  name: 'LCP' | 'FCP' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
}

interface PerformanceState {
  metrics: Record<string, Metric>;
  score: number;
  updateMetric: (metric: Metric) => void;
  resetMetrics: () => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      metrics: {},
      score: 100, // Default optimistic score

      updateMetric: (metric) => {
        set((state) => {
          const newMetrics = { ...state.metrics, [metric.name]: metric };

          // Calculate score based on weighted average of available metrics
          // Weights: LCP (25%), CLS (25%), INP (25%), FCP (10%), TTFB (15%)
          // This is a simplified scoring model for demonstration
          let totalWeight = 0;
          let weightedSum = 0;

          const weights: Record<string, number> = {
            LCP: 0.25,
            CLS: 0.25,
            INP: 0.25,
            FCP: 0.1,
            TTFB: 0.15,
          };

          Object.values(newMetrics).forEach((m) => {
            const weight = weights[m.name] || 0.2;
            let score = 0;
            if (m.rating === 'good') score = 100;
            else if (m.rating === 'needs-improvement') score = 50;
            else score = 0;

            weightedSum += score * weight;
            totalWeight += weight;
          });

          const normalizedScore =
            totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;

          return {
            metrics: newMetrics,
            score: normalizedScore,
          };
        });
      },

      resetMetrics: () => set({ metrics: {}, score: 100 }),
    }),
    {
      name: 'performance-storage',
    },
  ),
);
