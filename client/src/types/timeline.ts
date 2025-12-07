export interface TimelineDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  count: number;
  threatCount: number;
  normalCount: number;
}

export type TimelineInterval = 'second' | 'minute' | 'hour';
