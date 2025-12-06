# Story 4.6: Historical Performance Trends with Time Filters

**Story ID:** 4.6
**Epic:** 4 (Performance Monitoring Dashboard)
**Status:** Ready for Development

## User Story

As a developer,
I want to identify performance degradation over time,
So that I can spot memory leaks or accumulated slowness during long sessions.

## Acceptance Criteria

### AC 1: Trend Graph Component
- [x] `TrendGraph` component renders a line chart of collected metrics.
- [x] X-axis represents time (duration of session).
- [x] Y-axis represents metric value (ms, or score).
- [x] Supports multiple series (e.g., LCP vs FCP vs Memory).

### AC 2: Time Window Filtering
- [x] Users can filter the view window:
    - Last 5 Minutes
    - Last 15 Minutes
    - Full Session

### AC 3: Data Collection
- [x] The `TrendAnalyzer` service maintains a circular buffer of metric history (e.g., snapshots every 5 seconds).
- [x] Data points include timestamp and values for active metrics.

## Design & Implementation

### Component Structure
- **`TrendGraph.tsx`**: Uses `recharts` LineChart.
- **`TrendControls.tsx`**: Buttons for time window selection.

### Data Model
```typescript
interface HistoryPoint {
  timestamp: number;
  lcp?: number;
  cls?: number;
  memory?: number; // performance.memory.usedJSHeapSize
}
```

### Technical Notes
- `performance.memory` is non-standard (Chrome only). Wrap it safely.
- Chart should perform well with 500+ points. Use `recharts` optimization or downsampling if needed.

## Dependencies
- Story 4.1 (Vitals)
