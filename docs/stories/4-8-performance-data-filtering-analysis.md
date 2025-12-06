# Story 4.8: Performance Data Filtering & Analysis

**Story ID:** 4.8
**Epic:** 4 (Performance Monitoring Dashboard)
**Status:** Done

## User Story

As a developer,
I want to filter performance data by various criteria,
So that I can isolate specific issues (e.g., slow images vs slow API calls).

## Acceptance Criteria

### AC 1: Filter Controls
- [x] Controls to filter data views by:
    - Resource Type (JS, CSS, Img, XHR)
    - Domain (Internal vs External/3rd Party)
    - Duration (>N ms)

### AC 2: Applied Filtering
- [x] When a filter is active, the Waterfall Chart, Trend Graph, and Summary metrics reflect the filtered subset.

## Design & Implementation

### Component Structure
- **`PerformanceFilters.tsx`**: Dropdowns/Inputs.
- **`usePerformanceFilter`**: Hook to manage filter state and apply predicate logic to collected entries.

## Dependencies
- Story 4.4, 4.5, 4.6 (All views need to accept filtered data).

## Tasks/Subtasks

- [x] Implement `usePerformanceFilter` hook
    - [x] Add state for Resource Type, Min Duration, and Domain (Internal/External)
    - [x] Implement filtering logic for ResourceTiming (match type, duration, domain)
    - [x] Implement filtering logic for LongTasks (match duration)
- [x] Create `PerformanceFilters` component
    - [x] Dropdown for Resource Type
    - [x] Dropdown for Domain (All, Internal, External)
    - [x] Input for Min Duration
- [x] Integrate Filters into `PerformanceDashboard`
    - [x] wire up `usePerformanceFilter`
    - [x] Pass filtered data to child components
- [x] Update `WaterfallChart` to use filtered data
    - [x] Remove internal redundant filtering logic
    - [x] Display filtered resources from props
- [x] Update `TrendGraph` to use filtered data
    - [x] Apply resource/domain filters to trend metrics if possible (or document why not)
    - *Note:* Trend metrics are global page-level aggregates; retroactive filtering by resource type is not supported by current data model.
- [x] Verify Global Metrics (Vitals) behavior
    - [x] Decide if Vitals should be filtered (usually page-level, but check AC requirements)
    - *Note:* Vitals are page-level (LCP, CLS) and should not be filtered by resource type.
- [x] Verify and Test
    - [x] Unit tests for hook with all filter combinations
    - [x] Integration tests for Dashboard

## Dev Agent Record

### Implementation Notes
- **Strategy**: Filter at the Dashboard level and pass down to views.
- **Refactoring**: `WaterfallChart` currently has its own filters; these should be removed in favor of the global dashboard filters to avoid confusion.
- **Global Metrics**: Decided NOT to filter global metrics/trends by resource type as they are aggregate page-level indicators.

### Change Log
- Initial tasks setup.
- Implemented `usePerformanceFilter` with Domain logic.
- Updated `PerformanceFilters` with Domain dropdown.
- Refactored `WaterfallChart` to use props.
- Fixed `PerformanceDashboard` integration.

### File List
- client/src/hooks/usePerformanceFilter.ts
- client/src/hooks/usePerformanceFilter.test.ts
- client/src/components/performance/PerformanceFilters.tsx
- client/src/components/performance/PerformanceDashboard.tsx
- client/src/components/performance/WaterfallChart.tsx
- client/src/components/performance/LongTasksView.tsx
- client/src/components/performance/PerformanceDashboard.test.tsx
- client/src/components/performance/TrendControls.tsx
- client/src/components/performance/TrendGraph.tsx



## Walkthrough Review

# Story 4.8: Performance Data Filtering Walkthrough

I have implemented the performance data filtering functionality, enabling users to analyze performance data by resource type and duration.

## Changes
### 1. New Hook: `usePerformanceFilter`
- Created a custom hook to manage filter state (`resourceType`, `minDuration`).
- Implemented efficient filtering logic for `ResourceTiming` and `LongTask` arrays using `useMemo`.

### 2. New Component: `PerformanceFilters`
- Added a UI component with:
  - Dropdown menu for selecting resource types (Script, CSS, Fetch, etc.).
  - Input field for specifying minimum duration (ms).

### 3. Dashboard Integration
- Updated `PerformanceDashboard` to integrate the filtering hook and component.
- The dashboard now passes filtered data to child components:
  - `WaterfallChart`: Displays only resources matching the selected type and duration.
  - `LongTasksView`: Displays only long tasks longer than the minimum duration.
- Refactored `PerformanceDashboard` to use `VitalsCard` for individual metrics, improving layout and code reuse.

## Verification
### Automated Tests
- **Hook Tests**: Verified `usePerformanceFilter` correctly filters resources and tasks based on various criteria.
- **Component Tests**: Verified `PerformanceDashboard` renders all components and passes filters correctly.

### Manual Verification Steps
1. Open the Performance Dashboard.
2. Use the "Type" dropdown to filter by "Scripts". Verify `WaterfallChart` only shows script resources.
3. Set "Min Duration" to 50ms. Verify `LongTasksView` and `WaterfallChart` exclude shorter items.
4. "Reset Metrics" clears data but keeps filters active (as they are local state).

## Screenshots
(Placeholder for screenshots of the dashboard with filters applied)

## Verification Results

### Automated Tests
`npm test src/services/scoreCalculator.test.ts` and `src/store/performanceStore.test.ts` passed.

```bash
 ✓ calculateScore (4)
   ✓ returns 100 when metrics are empty
   ✓ calculates perfect score for perfect metrics
   ✓ calculates poor score for poor metrics
   ✓ handles mixed performance correctly

 ✓ performanceStore (3)
   ✓ should update score when metrics are updated
```

## UI Polish and Fixes (Story 4.8 Follow-up)
- **Dashboard Theme**: Fixed `PerformanceDashboard` to use proper theme variables (`bg-background`, `text-foreground`) instead of hardcoded gray/black, ensuring full Dark Mode compatibility.
- **Layout Refinements**:
    - Wrapped `ScoreGauge` in a responsive card.
    - Updated `VitalsCard` to stretch (`h-full`) for consistent grid heights.
    - Moved `NavigationTimingView` to the left column to balance the dashboard and prevent `LongTasksView` from overlapping other components.
- **Component Fixes**: Repaired `PerformanceFilters` styling and functionality.
