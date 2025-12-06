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
- [ ] `TrendGraph` component renders a line chart of collected metrics.
- [ ] X-axis represents time (duration of session).
- [ ] Y-axis represents metric value (ms, or score).
- [ ] Supports multiple series (e.g., LCP vs FCP vs Memory).

### AC 2: Time Window Filtering
- [ ] Users can filter the view window:
    - Last 5 Minutes
    - Last 15 Minutes
    - Full Session

### AC 3: Data Collection
- [ ] The `TrendAnalyzer` service maintains a circular buffer of metric history (e.g., snapshots every 5 seconds).
- [ ] Data points include timestamp and values for active metrics.

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
