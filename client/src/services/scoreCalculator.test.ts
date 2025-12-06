import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoreCalculator';
import { Metric } from '../store/performanceStore';

describe('calculateScore', () => {
  const createMetric = (name: string, value: number): Metric => ({
    name: name as any,
    value,
    rating: 'good',
    delta: 0,
    id: 'test',
  });

  it('returns 100 when metrics are empty', () => {
    expect(calculateScore({})).toBe(100);
  });

  it('calculates perfect score for perfect metrics', () => {
    const metrics: Record<string, Metric> = {
      LCP: createMetric('LCP', 100), // Very fast
      CLS: createMetric('CLS', 0), // No shift
      INP: createMetric('INP', 10), // Very responsive
    };
    const score = calculateScore(metrics);
    expect(score).toBeGreaterThanOrEqual(99);
  });

  it('calculates poor score for poor metrics', () => {
    const metrics: Record<string, Metric> = {
      LCP: createMetric('LCP', 5000), // > 4000 is poor
      CLS: createMetric('CLS', 0.5), // > 0.25 is poor
    };
    const score = calculateScore(metrics);
    expect(score).toBeLessThan(50);
  });

  it('handles mixed performance correctly', () => {
    // LCP is good (90), CLS is poor (~40)
    // Weights: LCP (0.25), CLS (0.25). Normalized.
    // Score should be average of ~90 and ~40 -> ~65
    const metrics: Record<string, Metric> = {
      LCP: createMetric('LCP', 2500), // At threshold -> 90
      CLS: createMetric('CLS', 0.3), // Poor -> < 50
    };

    const score = calculateScore(metrics);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(80);
  });
});
