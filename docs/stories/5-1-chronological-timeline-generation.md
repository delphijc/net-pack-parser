# Story 5.1: Chronological Timeline Generation

**Story ID:** 5.1
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As a forensic investigator,
I want to see a visual timeline of all captured packets,
So that I can understand the activity distribution and volume over time.

## Acceptance Criteria

### AC 1: Timeline Rendering
- [ ] `TimelineView` component renders a chart showing packet activity over the capture duration.
- [ ] X-axis represents time (UTC).
- [ ] Y-axis represents packet count (per time bucket, e.g., per second).
- [ ] Data is visualized as a bar or area chart.

### AC 2: Scalability
- [ ] The timeline handles large captures (e.g., 100k packets) without browser freezing.
- [ ] (Technical) Use efficient rendering (Canvas or optimized SVG) or data aggregation.

## Design & Implementation

### Component Structure
- **`TimelineView.tsx`**: Main component.
- **`TimelineChart.tsx`**: Wrapper for the charting library (e.g., Recharts, VisX, or Chart.js).

### Data Model
- Aggregated buckets: `{ timestamp: number, count: number }`.

## Dependencies
- Epic 1 (Parsed Data).
