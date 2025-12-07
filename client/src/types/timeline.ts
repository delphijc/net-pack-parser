
export interface TimelineDataPoint {
    timestamp: number; // Unix timestamp in milliseconds
    count: number;
}

export type TimelineInterval = 'second' | 'minute' | 'hour';
