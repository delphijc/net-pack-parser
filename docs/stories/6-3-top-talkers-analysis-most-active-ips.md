# Story 6.3: Top Talkers Analysis (Most Active IPs)

**Story ID:** 6.3
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Ready for Development

## User Story

As an analyst,
I want to identify the IP addresses responsible for the most traffic,
So that I can investigate potential attackers or compromised hosts.

## Acceptance Criteria

### AC 1: Top N List
- [ ] Dashboard displays a list (Table or Horizontal Bar Chart) of the top Source and Destination IPs by volume (bytes).

### AC 2: Details
- [ ] Shows IP address, total bytes, and packet count.
- [ ] (Enhancement) Shows resolved hostname if available.

### AC 3: Filtering
- [ ] Clicking an IP adds it to the global filter (e.g., `ip.src == X`).

## Design & Implementation

### Component Structure
- **`TopTalkers.tsx`**: Tabbed view (Source / Destination).

## Dependencies
- Epic 1.
