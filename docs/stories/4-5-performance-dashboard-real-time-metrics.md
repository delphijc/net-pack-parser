# Story 4.5: Performance Dashboard & Real-Time Metrics

**Story ID:** 4.5
**Epic:** 4 (Performance Monitoring Dashboard)
**Status:** Ready for Development

## User Story

As a developer,
I want a centralized dashboard view of all performance metrics,
So that I can see the application's health at a glance.

## Acceptance Criteria

### AC 1: Dashboard Layout
- [x] `PerformanceDashboard` is the main container for the Monitoring tab.
- [x] Layout uses a grid system to organize Vitals cards, Waterfall chart, and Trend graphs.
- [x] Includes a header with "Reset Metrics" and "Export Performance Data" controls.

### AC 2: Real-time Metric Updates
- [x] The dashboard subscribes to real-time performance events (via `usePerformanceObserver`).
- [x] When a new metric entry (e.g., LCP update, new Long Task) is verified, the UI updates immediately.
- [x] Metric cards (created in Story 4.1) are integrated into this dashboard.

### AC 3: Performance Score Integration
- [x] The proprietary Performance Score (from Story 4.7, placeholder if not ready) is displayed prominently.
- [x] A "Health" badge (Good/Fair/Poor) summarizes the overall state.

### AC 4: Session Persistence (Optional)
- [ ] Metric data persists across tab reloads (stored in localStorage) so history isn't lost on refresh (optional, MVP can be session-only).

## Design & Implementation

### Component Structure
- **`PerformanceDashboard.tsx`**: The orchestrator.
- **`DashboardGrid.tsx`**: Layout component.
- **`MetricSummary.tsx`**: Groups the vital cards.

## Dependencies
- Story 4.1 (Vitals Monitoring) - Must consume the data produced there.
- Story 4.4 (Waterfall) - Will embed the chart defined there.
