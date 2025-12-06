import type { Metric } from '../store/performanceStore';

// Curve definition for log-normal distribution
// Based on Lighthouse scoring curves
interface ScoreCurve {
  median: number;
  p10: number;
}

const CURVES: Record<string, ScoreCurve> = {
  LCP: { median: 2500, p10: 4000 },
  FCP: { median: 1800, p10: 3000 },
  CLS: { median: 0.1, p10: 0.25 },
  INP: { median: 200, p10: 500 },
  TTFB: { median: 800, p10: 1800 },
};

const WEIGHTS: Record<string, number> = {
  LCP: 0.25,
  CLS: 0.25,
  INP: 0.25,
  FCP: 0.1,
  TTFB: 0.15,
};

const calculatePiecewiseScore = (params: ScoreCurve, value: number): number => {
  // Treating 'median' as the "Good" threshold (score 90)
  // Treating 'p10' as the "Poor" threshold (score 50)

  // WAIT: Lighthouse definitions are:
  // LCP Good < 2500. So at 2500, score is 90.
  // LCP Poor > 4000. So at 4000, score is 50.

  const goodThreshold = params.median;
  const poorThreshold = params.p10;

  if (value <= goodThreshold) {
    // Map 0 to goodThreshold -> 100 to 90
    const ratio = value / goodThreshold;
    return 100 - 10 * ratio;
  } else if (value <= poorThreshold) {
    // Map goodThreshold to poorThreshold -> 90 to 50
    const range = poorThreshold - goodThreshold;
    const offset = value - goodThreshold;
    const ratio = offset / range;
    return 90 - 40 * ratio;
  } else {
    // Map poorThreshold upwards -> 50 decaying to 0
    // Let's just linear decay to 0 at 2x poorThreshold
    const range = poorThreshold; // roughly another poorThreshold width
    const offset = value - poorThreshold;
    const ratio = Math.min(offset / range, 1);
    return 50 - 50 * ratio;
  }
};

export const calculateScore = (metrics: Record<string, Metric>): number => {
  let totalWeight = 0;
  let weightedSum = 0;

  Object.values(metrics).forEach((metric) => {
    const weight = WEIGHTS[metric.name];
    const curve = CURVES[metric.name];

    if (weight && curve) {
      const metricScore = calculatePiecewiseScore(curve, metric.value);
      weightedSum += metricScore * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return 100; // No metrics yet

  return Math.round(weightedSum / totalWeight);
};
