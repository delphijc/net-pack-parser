# Story 5.6: Timeline Filtering by Threat Level & Protocol

**Story ID:** 5.6
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

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

### Component Structure
- **`TimelineControls.tsx`**: Toolbar controls.
- Update `TimelineView` to accept filter props.

## Dependencies
- Epic 3 (Threat Detection).
