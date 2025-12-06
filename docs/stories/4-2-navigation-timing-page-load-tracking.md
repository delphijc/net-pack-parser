# Story 4.2: Navigation Timing & Page Load Tracking

Status: ready-for-dev

## Story

As a developer,
I want to visualize the page load timing phases (DNS, TCP, Request, Response, DOM Processing, Load),
so that I can identify which stage of the network/loading process is slowing down the application or analyzed traffic.

## Acceptance Criteria

1.  **Capture Timing**: The system captures `PerformanceNavigationTiming` data on page load.
2.  **Phase Visualization**: A horizontal bar chart (or timeline) displays the distinct phases:
    *   DNS Lookup (`domainLookupEnd` - `domainLookupStart`)
    *   TCP Connection (`connectEnd` - `connectStart`)
    *   Request/Response (`responseEnd` - `requestStart`)
    *   DOM Processing (`domComplete` - `domInteractive`)
    *   Load Event (`loadEventEnd` - `loadEventStart`)
3.  **Metrics Display**: Key timestamps (e.g., TTFB, Dom Interactive, Load Complete) are displayed numerically.
4.  **Integration**: The component is embedded in the Performance Dashboard.

## Tasks / Subtasks

- [ ] **1. Navigation Hook** (AC1)
  - [ ] **1.1. create useNavigationTiming**:
    - [ ] Create `client/src/hooks/useNavigationTiming.ts`.
    - [ ] Use `performance.getEntriesByType('navigation')[0]`.
    - [ ] Extract standardized phase durations.

- [ ] **2. UI Visualization** (AC2, AC3)
  - [ ] **2.1. NavigationTimingView Component**:
    - [ ] Create `client/src/components/performance/NavigationTimingView.tsx`.
    - [ ] Use `recharts` BarChart (stacked) or a custom CSS grid implementation for the timeline.
    - [ ] Tooltips to show exact duration of each phase.
  - [ ] **2.2. Metric Chips**:
    - [ ] Display summary metrics (Load Time, DNS Time) below the chart.

- [ ] **3. Dashboard Integration** (AC4)
  - [ ] **3.1. Update Dashboard**:
    - [ ] Add `NavigationTimingView` to `PerformanceDashboard.tsx`.

- [ ] **4. Testing**
  - [ ] **4.1. Unit Tests**:
    - [ ] Test metric calculation helper functions.
  - [ ] **4.2. Component Tests**:
    - [ ] Mock `performance.getEntriesByType` and verify Chart rendering.

## Dev Notes

- **Architecture**:
  - Requires `PerformanceNavigationTiming` (Level 2). Fallback to `timing` (Level 1) if essential, but standard modern browsers support Level 2.
  - **Visualization**: A Gantt-style or Stacked Bar chart is best.

### References

- [Source: docs/stories/tech-spec-epic-4.md#Detailed Design]

## Dev Agent Record

### Context Reference

- [Context File](docs/stories/4-2-navigation-timing-page-load-tracking.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

## Learnings from Previous Story

**From Story 4.1: Core Web Vitals Monitoring (Status: done)**

- **Components**: `PerformanceDashboard` is the main container. Mount new views there.
- **Dependencies**: `recharts` is available and should be used for charts.
- **State**: Navigation timing is static after load; doesn't need complex Zustand subscription like Vitals, but can store in `performanceStore` if we want to persist it. Local component state is likely sufficient since it doesn't change after load.
