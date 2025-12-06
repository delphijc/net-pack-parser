# Story 6.1: Protocol Distribution Visualization (Pie/Bar Charts)

**Story ID:** 6.1
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Ready for Development

## User Story

As an analyst,
I want to see the breakdown of network protocols (HTTP, TCP, UDP, etc.) in the captured data,
So that I can quickly identify the dominant traffic types or unexpected protocols.

## Acceptance Criteria

### AC 1: Rendering
- [ ] Dashboard displays a chart (Pie or Bar) showing the distribution of protocols.
- [ ] Legend identifies each protocol and its percentage.

### AC 2: Interaction
- [ ] Clicking a slice/bar filters the main Packet List to show only packets of that protocol.

### AC 3: Data Aggregation
- [ ] System accurately counts packets per protocol from the parsed dataset.

## Design & Implementation

### Component Structure
- **`ProtocolDistribution.tsx`**: Uses `recharts` PieChart.

### Data Model
- Aggegration: `{ protocol: string, count: number, percent: number }`.

## Dependencies
- Epic 1 (Parsed Data).
