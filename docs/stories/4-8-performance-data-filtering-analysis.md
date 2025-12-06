# Story 4.8: Performance Data Filtering & Analysis

**Story ID:** 4.8
**Epic:** 4 (Performance Monitoring Dashboard)
**Status:** Ready for Development

## User Story

As a developer,
I want to filter performance data by various criteria,
So that I can isolate specific issues (e.g., slow images vs slow API calls).

## Acceptance Criteria

### AC 1: Filter Controls
- [ ] Controls to filter data views by:
    - Resource Type (JS, CSS, Img, XHR)
    - Domain (Internal vs External/3rd Party)
    - Duration (>N ms)

### AC 2: Applied Filtering
- [ ] When a filter is active, the Waterfall Chart, Trend Graph, and Summary metrics reflect the filtered subset.

## Design & Implementation

### Component Structure
- **`PerformanceFilters.tsx`**: Dropdowns/Inputs.
- **`usePerformanceFilter`**: Hook to manage filter state and apply predicate logic to collected entries.

## Dependencies
- Story 4.4, 4.5, 4.6 (All views need to accept filtered data).
