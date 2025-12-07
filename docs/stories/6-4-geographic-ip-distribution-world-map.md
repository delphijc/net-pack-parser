# Story 6.4: Geographic IP Distribution (World Map)

**Story ID:** 6.4
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Done

## User Story

As an analyst,
I want to map IP addresses to their geographic locations,
So that I can visualize the physical origin and destination of traffic.

## Acceptance Criteria

### AC 1: Map Visualization
- [x] Dashboard displays a World Map with markers or heatmap overlays indicating IP activity.
- [x] Hovering a country/marker shows connection counts.

### AC 2: Geo Lookup
- [x] System resolves public IPs to Country/City.
- [x] Private IPs (LAN) are excluded or marked "Local".

### AC 3: Dependencies
- [x] Uses a local database or robust offline mapping to avoid leaking IPs to 3rd party APIs.

## Design & Implementation

### Component Structure
- **`GeoMap.tsx`**: Uses `react-simple-maps` or Leaflet (if offline tiles available, simplified is better).

### Libraries
- `mmdb-lib` with a bundled Lite DB (e.g., GeoLite2 Country) or a static JSON mapping for countries.

## Dependencies
- Epic 1.
