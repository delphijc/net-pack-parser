# Story 5.2: Interactive Timeline with Zoom & Pan

**Story ID:** 5.2
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As an analyst,
I want to zoom into specific time ranges and pan across the timeline,
So that I can investigate bursts of traffic or isolate specific seconds of activity.

## Acceptance Criteria

### AC 1: Zoom Controls
- [ ] Users can zoom in/out via mouse wheel or buttons.
- [ ] Zooming updates the X-axis time scale (e.g., from 1 hour spread to 1 minute spread).

### AC 2: Pan Controls
- [ ] Users can drag the timeline (pan) left/right to view different time periods at the current zoom level.

### AC 3: Synchronization
- [ ] Changing the visible timeline range filters the Main Packet List to show only packets within that window.

## Design & Implementation

### Component Structure
- **`TimelineView.tsx`**: (Existing from 5.1) Add zoom/pan handlers.
- **`useTimelineState`**: Zustand store for `[startTime, endTime]` viewport.

## Dependencies
- Story 5.1.
