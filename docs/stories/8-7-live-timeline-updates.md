# Story 8.7: Live Timeline Updates

**Story ID:** 8.7
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Ready for Development

## User Story

As a user,
I want the timeline chart to grow automatically as new data comes in,
So that I can see the traffic pattern evolving over time.

## Acceptance Criteria

### AC 1: Dynamic X-Axis
- [ ] Timeline chart automatically expands its X-axis domain to include the `timestamp` of the newest packet.
- [ ] Smooth transition/interpolation is preferred.

### AC 2: Performance
- [ ] Timeline does not re-render the entire history for every packet.
- [ ] Uses canvas-based rendering or optimized SVG updates.

## Design & Implementation

### Component Structure
- **`TimelineView.tsx`**: Add `useEffect` listening to `liveStore`.

## Dependencies
- Story 8.4 (Data arrival).
