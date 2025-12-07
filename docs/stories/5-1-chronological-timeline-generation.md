# Story 5.1: Chronological Timeline Generation

**Story ID:** 5.1
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Done

## User Story

As a forensic investigator,
I want to see a visual timeline of all captured packets,
So that I can understand the activity distribution and volume over time.

## Acceptance Criteria

### AC 1: Timeline Rendering
- [x] `TimelineView` component renders a chart showing packet activity over the capture duration.
- [x] X-axis represents time (UTC).
- [x] Y-axis represents packet count (per time bucket, e.g., per second).
- [x] Data is visualized as a bar or area chart.

### AC 2: Scalability
- [x] The timeline handles large captures (e.g., 100k packets) without browser freezing.
- [x] (Technical) Use efficient rendering (Canvas or optimized SVG) or data aggregation.

## Design & Implementation

### Component Structure
- **`TimelineView.tsx`**: Main component.
- **`TimelineChart.tsx`**: Wrapper for the charting library (e.g., Recharts, VisX, or Chart.js).

### Data Model
- Aggregated buckets: `{ timestamp: number, count: number }`.

## Dependencies
- Epic 1 (Parsed Data).

## Tasks/Subtasks
- [x] Implement Timeline Data Model & Aggregation logic
    - [x] Create `client/src/types/timeline.ts` for timeline data structures
    - [x] Create `client/src/utils/timelineUtils.ts` (or service) for bucket aggregation
    - [x] Unit test aggregation with mock packets
- [x] Implement TimelineChart component
    - [x] Install charting library (recharts or similar if not already present, or use standard SVG/Canvas)
    - [x] Create `client/src/components/TimelineChart.tsx`
    - [x] Unit test rendering with mock data
- [x] Implement TimelineView component
    - [x] Create `client/src/components/TimelineView.tsx`
    - [x] Integrate `TimelineChart` and use aggregation logic
    - [x] Handle loading states and large data sets
- [x] Integration & Optimization
    - [x] Integrate `TimelineView` into the main application layout (e.g., Dashboard or separate tab)
    - [x] Test with large PCAP files (verify no freezing)
    - [x] Verify UTC time display
- [x] Final Verification
    - [x] Verify AC 1: Timeline Rendering
    - [x] Verify AC 2: Scalability
- [x] Review Follow-ups (AI)
    - [x] [AI-Review][Critical] Optimize Dashboard polling to prevent re-aggregation re-renders [client/src/components/dashboard/Dashboard.tsx]
    - [x] [AI-Review][Low] Add NaN timestamp validation in aggregation utils [client/src/utils/timelineUtils.ts]
    - [ ] [AI-Review][Medium] Move aggregation to Web Worker (Deferred to future refactor)

## Dev Notes
- **Architecture Requirements**:
    - Use `shadcn/ui` where applicable.
    - Component file structure: `client/src/components/...`
    - Logic should be separable from UI for testing.
- **Previous Learnings**:
    - Large file processing can block the UI. Consider using Web Workers if aggregation is heavy, though for header timestamps it might be fast enough if optimized.
    - existing `ProcessedPacket` type is available.

## Dev Agent Record
### Implementation Plan
- [x] Create data model and utils for aggregation.
- [x] Implement TimelineChart using Recharts.
- [x] Integrate into Dashboard via TimelineView.

### Debug Log
- 

### Completion Notes
- Implemented chronological timeline analysis.
- Used `recharts` for visualization.
- Created `generateTimelineData` utility to aggregate packets into 1-second buckets.
- Tested with unit tests and verified integration in Dashboard.
- **Review Notes:** Addressed Critical performance issue in Dashboard polling and Low severity validation issue. Deferred Web Worker refactor.

## File List
- client/src/types/timeline.ts
- client/src/utils/timelineUtils.ts
- client/src/utils/timelineUtils.test.ts
- client/src/components/TimelineChart.tsx
- client/src/components/TimelineChart.test.tsx
- client/src/components/TimelineView.tsx
- client/src/components/TimelineView.test.tsx
- client/src/components/dashboard/Dashboard.tsx 

## Change Log
-
