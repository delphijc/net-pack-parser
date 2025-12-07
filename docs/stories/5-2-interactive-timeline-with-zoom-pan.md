# Story 5.2: Interactive Timeline with Zoom & Pan

**Story ID:** 5.2
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Done

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

## Tasks/Subtasks
- [x] Implement Timeline State Management
    - [x] Create `client/src/store/timelineStore.ts` using Zustand
    - [x] Define actions: `setRange`, `resetRange`, `zoomIn`, `zoomOut`
- [x] Upgrade TimelineChart
    - [x] Add `Brush` component from `recharts` for panning/zooming
    - [ ] Add `ReferenceArea` logic for click-and-drag zoom (optional, start with Brush)
    - [x] Connect chart to `timelineStore` (via View)
- [x] Add Zoom Controls
    - [x] Create Zoom In/Out buttons in `TimelineView`
    - [x] Bind buttons to store actions
- [x] Synchronize Packet List
    - [x] Update `PacketList` component (or `PcapAnalysisPage`) to filter packets checks `timelineStore`
- [x] Verification
    - [x] Test state updates
    - [x] Test filtering logic

## Dev Notes
- **Recharts Brush**: This is the easiest way to add a "minimap" style zoom/pan.
- **State Location**: Zustand is perfect for sharing this state between the Timeline tab and the Packet List tab.

## Dev Agent Record
### Implementation Plan
- **State**: `useTimelineStore` with `startTime` (number | null) and `endTime` (number | null).
- **Chart**: Add `<Brush />` to `TimelineChart`.
- **Sync**: `PacketList` subscribes to store and filters the `packets` prop before rendering. (Or the parent filters it).

### Debug Log
- 

### Completion Notes
- Implemented `useTimelineStore` with Zustand.
- Upgraded `TimelineChart` with `Brush` and logic to drive store.
- Added Zoom In/Out/Reset buttons to `TimelineView` (controlled the view range via store).
- Integrated filtering in `PcapAnalysisPage`.
- Build Verified. 

## File List
- client/src/hooks/useDebounce.ts
- client/src/pages/PcapAnalysisPage.tsx
- client/src/store/timelineStore.ts
- client/src/components/TimelineChart.tsx
- client/src/components/TimelineView.tsx
- client/src/components/PacketList.tsx (or parent)

## Change Log
- 

