# Story 6.2: Traffic Volume Over Time (Line Graphs)

**Story ID:** 6.2
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Ready for Development

## User Story

As an analyst,
I want to visualize the volume of traffic (packets/bytes) over the duration of the capture,
So that I can spot bursts, quiet periods, or rhythmic patterns.

## Acceptance Criteria

### AC 1: Volume Chart
- [ ] Dashboard displays an Area or Line chart of traffic volume.
- [ ] X-axis: Time. Y-axis: Bits/sec or Packets/sec.

### AC 2: Granularity
- [ ] Chart automatically adjusts bucket size (seconds, minutes) based on total duration.

### AC 3: Filter Sync
- [ ] Zooming/Filtering this chart updates the core time filter (shared with Story 5.2 Timeline).

## Design & Implementation

### Component Structure
- **`TrafficVolume.tsx`**: Uses `recharts` AreaChart.

## Dependencies
- Story 5.1 (Timeline Generation logic is similar).
