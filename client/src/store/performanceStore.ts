import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateScore } from '../services/scoreCalculator';

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

export interface Metric {
  name: 'LCP' | 'FCP' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
}

export interface ResourceTiming {
  id: string;
  name: string;
  initiatorType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  breakdown: {
    dns: number;
    tcp: number;
    ttfb: number;
    download: number;
  };
}

export interface LongTask {
  id: string;
  startTime: number;
  duration: number;
  attribution: string;
  timestamp: number;
}

export interface HistoryPoint {
  timestamp: number;
  metrics: Record<string, number>;
  score: number;
}

interface PerformanceState {
  metrics: Record<string, Metric>;
  longTasks: LongTask[];
  resources: ResourceTiming[];
  metricHistory: HistoryPoint[];
  score: number;
  updateMetric: (metric: Metric) => void;
  addLongTask: (task: LongTask) => void;
  addResource: (resource: ResourceTiming) => void;
  addHistoryPoint: (point: HistoryPoint) => void;
  resetMetrics: () => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      metrics: {},
      longTasks: [],
      resources: [],
      metricHistory: [],
      score: 100, // Default optimistic score

      updateMetric: (metric) => {
        set((state) => {
          const newMetrics = { ...state.metrics, [metric.name]: metric };

          const normalizedScore = calculateScore(newMetrics);

          return {
            metrics: newMetrics,
            score: normalizedScore,
          };
        });
      },

      addLongTask: (task) => {
        set((state) => {
          // Add new task and keep only the last 50 entries
          const updatedTasks = [task, ...state.longTasks].slice(0, 50);
          return { longTasks: updatedTasks };
        });
      },

      addResource: (resource) => {
        set((state) => {
          // Add new resource and keep only the last 100 entries to prevent memory bloat
          const updatedResources = [resource, ...state.resources].slice(0, 100);
          return { resources: updatedResources };
        });
      },

      addHistoryPoint: (point) => {
        set((state) => {
          // Keep last 500 points (approx 40 mins at 5s interval)
          const updatedHistory = [...state.metricHistory, point].slice(-500);
          return { metricHistory: updatedHistory };
        });
      },

      resetMetrics: () =>
        set({
          metrics: {},
          score: 100,
          longTasks: [],
          resources: [],
          metricHistory: [],
        }),
    }),
    {
      name: 'performance-storage',
      partialize: (state) => ({
        metrics: state.metrics,
        score: state.score,
        longTasks: state.longTasks,
        resources: state.resources,
        metricHistory: state.metricHistory,
      }),
    },
  ),
);
