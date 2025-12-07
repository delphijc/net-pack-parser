# Story 5.6: Timeline Filtering by Threat Level & Protocol

**Story ID:** 5.6
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Done

## User Story

As an analyst,
I want to filter the timeline to show only High Severity threats or specific protocols,
So that I can cut through the noise and focus on malicious activity.

## Acceptance Criteria

### AC 1: Filter Controls
- [ ] Timeline toolbar includes "Show Threats Only" toggle.
- [ ] Dropdown for Protocol filtering (HTTP, DNS, TCP, etc.).

### AC 2: Visual Indicators
- [ ] Threat events on the timeline are colored red/orange based on severity.
- [ ] When filtered, non-matching events are hidden from the timeline chart.

## Design & Implementation

## Tasks/Subtasks
- [x] State & Controls
    - [x] Create `client/src/components/TimelineControls.tsx`.
    - [x] Add "Show Threats Only" toggle.
    - [x] Add Protocol Dropdown (or reuse components).
    - [x] Add filter state to `useTimelineStore` or `TimelineView` local state.
- [x] TimelineView Integration
    - [x] Integrate `TimelineControls` into `TimelineView`.
    - [x] Implement filtering logic: Filter `allPackets` before generating timeline data.
- [x] Visualization (AC 2)
    - [x] Update `generateTimelineData` (in `timelineUtils.ts`) to count `threats` vs `normal`.
    - [x] Update `TimelineChart.tsx` to likely use a Stacked Bar Chart (Threats stacked on Normal) or distinct colors.
    - [x] Ensure "Show Threats Only" filters out non-threats completely.
- [x] Verification
    - [x] Verify toggle shows only threat bars.
    - [x] Verify protocol filter shows only relevant traffic bars.
    - [x] Verify visual distinction of threats.

## Dev Notes
- `TimelineChart` currently likely uses one data key. Need to change to two (`normal`, `threat`) for stacking.
- `ParsedPacket` has `suspiciousIndicators`. Any > 0 => Threat.
- Colors: Normal = Primary (Purple/Blue), Threat = Destructive (Red).

## File List
- client/src/components/TimelineControls.tsx
- client/src/components/TimelineView.tsx
- client/src/components/TimelineChart.tsx
- client/src/utils/timelineUtils.ts
- client/src/types/timeline.ts
- client/src/store/timelineStore.ts

## Senior Developer Review (AI)
- **Date:** 2025-12-07
- **Outcome:** Approved
- **Summary:** Timeline filtering implemented effectively with new controls and stacked bar chart visualization. `TimelineView` logic is sound. `TimelineControls` provides intuitive UX. `timelineUtils` updated correctly for threat counting.

### Action Items
- [ ] None.

## Review Follow-ups (AI)
- [ ] None. 


## Dependencies
- Epic 3 (Threat Detection).
