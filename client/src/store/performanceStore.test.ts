import { describe, it, expect, beforeEach } from 'vitest';
import { usePerformanceStore, Metric } from './performanceStore';

describe('performanceStore', () => {
  beforeEach(() => {
    usePerformanceStore.getState().resetMetrics();
  });

  it('should initialize with default values', () => {
    const state = usePerformanceStore.getState();
    expect(state.metrics).toEqual({});
    expect(state.score).toBe(100);
  });

  it('should update metrics', () => {
    const metric: Metric = {
      name: 'LCP',
      value: 1200,
      rating: 'good',
      delta: 1200,
      id: 'test-id',
    };

    usePerformanceStore.getState().updateMetric(metric);
    const state = usePerformanceStore.getState();

    expect(state.metrics['LCP']).toEqual(metric);
  });

  it('should calculate score correctly', () => {
    // Good LCP (100 * 0.25 = 25)
    usePerformanceStore.getState().updateMetric({
      name: 'LCP',
      value: 1000,
      rating: 'good',
      delta: 1000,
      id: '1',
    });
    // Needs Improvement INP (50 * 0.25 = 12.5)
    usePerformanceStore.getState().updateMetric({
      name: 'INP',
      value: 250,
      rating: 'needs-improvement',
      delta: 250,
      id: '2',
    });
    // Poor CLS (0 * 0.25 = 0)
    usePerformanceStore.getState().updateMetric({
      name: 'CLS',
      value: 0.5,
      rating: 'poor',
      delta: 0.5,
      id: '3',
    });

    // Total weight: 0.75
    // Weighted sum: 25 + 12.5 + 0 = 37.5
    // Score = 37.5 / 0.75 = 50

    expect(usePerformanceStore.getState().score).toBe(50);
  });
});
