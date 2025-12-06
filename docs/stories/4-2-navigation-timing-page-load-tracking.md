# Story 4.2: Navigation Timing & Page Load Tracking

Status: review

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

- [x] **1. Navigation Hook** (AC1)
  - [x] **1.1. create useNavigationTiming**:
    - [x] Create `client/src/hooks/useNavigationTiming.ts`.
    - [x] Use `performance.getEntriesByType('navigation')[0]`.
    - [x] Extract standardized phase durations.

- [x] **2. UI Visualization** (AC2, AC3)
  - [x] **2.1. NavigationTimingView Component**:
    - [x] Create `client/src/components/performance/NavigationTimingView.tsx`.
    - [x] Use `recharts` BarChart (stacked) or a custom CSS grid implementation for the timeline.
    - [x] Tooltips to show exact duration of each phase.
  - [x] **2.2. Metric Chips**:
    - [x] Display summary metrics (Load Time, DNS Time) below the chart.

- [x] **3. Dashboard Integration** (AC4)
  - [x] **3.1. Update Dashboard**:
    - [x] Add `NavigationTimingView` to `PerformanceDashboard.tsx`.

- [x] **4. Testing**
  - [x] **4.1. Unit Tests**:
    - [x] Test metric calculation helper functions.
  - [x] **4.2. Component Tests**:
    - [x] Mock `performance.getEntriesByType` and verify Chart rendering.

## Dev Notes

- **Architecture**:
  - Requires `PerformanceNavigationTiming` (Level 2). Fallback to `timing` (Level 1) if essential, but standard modern browsers support Level 2.
  - **Visualization**: A Gantt-style or Stacked Bar chart is best.

### References

- [Source: docs/stories/tech-spec-epic-4.md#Detailed Design]

## Dev Agent Record

### Debug Log

- **[Plan]**
  - Create `useNavigationTiming` hook to capture `performance.getEntriesByType('navigation')`.
  - Create `NavigationTimingView` component using `recharts` or CSS for visualization.
  - Integrate into `PerformanceDashboard`.
  - Add unit/component tests.

### Context Reference

- [Context File](docs/stories/4-2-navigation-timing-page-load-tracking.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

- Implemented `useNavigationTiming` hook and `NavigationTimingView` component.
- Integrated into `PerformanceDashboard`.
- Verified with unit tests (hook) and component tests (view).
- Status updated to `review`.

### File List

- client/src/hooks/useNavigationTiming.ts
- client/src/hooks/useNavigationTiming.test.ts
- client/src/components/performance/NavigationTimingView.tsx
- client/src/components/performance/NavigationTimingView.test.tsx
- client/src/components/performance/PerformanceDashboard.tsx

## Learnings from Previous Story

**From Story 4.1: Core Web Vitals Monitoring (Status: done)**

- **Components**: `PerformanceDashboard` is the main container. Mount new views there.
- **Dependencies**: `recharts` is available and should be used for charts.
- **State**: Navigation timing is static after load; doesn't need complex Zustand subscription like Vitals, but can store in `performanceStore` if we want to persist it. Local component state is likely sufficient since it doesn't change after load.

## Change Log

- 2025-12-06: Senior Developer Review notes appended. Outcome: Approve.

## Senior Developer Review (AI)

- **Reviewer**: Antigravity
- **Date**: 2025-12-06
- **Outcome**: **Approve**

### Summary

The implementation fully satisfies the requirements for navigation timing and page load tracking. The hook correctly abstracts the `PerformanceNavigationTiming` API with proper browser support checks, and the visualization component effectively communicates the data using a stacked bar chart. Integration into the dashboard is seamless.

### Key Findings

- **No Critical Issues Found**.
- **Code Quality**: High. The use of `Math.max(0, ...)` in metric calculations is a good defensive practice against timing anomalies.
- **UX**: The visualization handles loading and unsupported states gracefully. Tooltips provide precise data points.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| :--- | :--- | :--- | :--- |
| 1 | Capture `PerformanceNavigationTiming` data | **IMPLEMENTED** | `client/src/hooks/useNavigationTiming.ts:39` |
| 2 | Phase Visualization (Bar Chart) | **IMPLEMENTED** | `client/src/components/performance/NavigationTimingView.tsx:65-83` |
| 3 | Metrics Display (Numerical) | **IMPLEMENTED** | `client/src/components/performance/NavigationTimingView.tsx:56, 86-97` |
| 4 | Dashboard Integration | **IMPLEMENTED** | `client/src/components/performance/PerformanceDashboard.tsx:67` |

**Summary**: 4 of 4 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| :--- | :--- | :--- | :--- |
| 1.1 `useNavigationTiming` | [x] | **VERIFIED** | `client/src/hooks/useNavigationTiming.ts` |
| 2.1 `NavigationTimingView` | [x] | **VERIFIED** | `client/src/components/performance/NavigationTimingView.tsx` |
| 2.2 Metric Chips | [x] | **VERIFIED** | `client/src/components/performance/NavigationTimingView.tsx:56` |
| 3.1 Update Dashboard | [x] | **VERIFIED** | `client/src/components/performance/PerformanceDashboard.tsx:67` |
| 4.1 Unit Tests | [x] | **VERIFIED** | `client/src/hooks/useNavigationTiming.test.ts` |
| 4.2 Component Tests | [x] | **VERIFIED** | `client/src/components/performance/NavigationTimingView.test.tsx` |

**Summary**: 6 of 6 completed tasks verified.

### Test Coverage and Gaps

- **Unit Tests**: `useNavigationTiming` is well-tested with mocked performance entries.
- **Component Tests**: `NavigationTimingView` has tests for Unsupported, Loading, and Rendered states.
- **Gaps**: None.

### Architectural Alignment

- Follows the project pattern of separating logic (hooks) from UI (components).
- Uses `shadcn/ui` components (`Card`, `Badge`) consistent with the design system.
- Correctly uses `PerformanceNavigationTiming` Level 2 API as per Tech Spec.

### Security Notes

- No significant security risks. Metric values are numeric and safe.

### Best-Practices and References

- [PerformanceNavigationTiming MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming)

### Action Items

**Advisory Notes:**
- Note: If we expand to "Connected Mode" in the future, we may need to send these metrics to the backend. Currently, they are client-side only.
