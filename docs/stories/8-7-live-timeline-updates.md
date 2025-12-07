# Story 8.7: Live Timeline Updates

**Story ID:** 8.7
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a user,
I want the timeline chart to grow automatically as new data comes in,
So that I can see the traffic pattern evolving over time.

## Acceptance Criteria

### AC 1: Dynamic X-Axis
- [x] Timeline chart automatically expands X-axis as new packets arrive (`LiveTimelineView`).
- [x] Recharts handles smooth transitions.

### AC 2: Performance
- [x] Updates throttled to once per second to avoid excessive re-renders.
- [x] Uses Recharts (SVG-based) with efficient update strategy.

## Design & Implementation

### Component Structure
- **`TimelineView.tsx`**: Add `useEffect` listening to `liveStore`.

## Dependencies
- Story 8.4 (Data arrival).
