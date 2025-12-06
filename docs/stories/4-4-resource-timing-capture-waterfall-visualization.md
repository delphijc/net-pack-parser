# Story 4.4: Resource Timing Capture & Waterfall Visualization

**Story ID:** 4.4
**Epic:** 4 (Performance Monitoring Dashboard)
**Status:** Ready for Development

## User Story

As a developer optimizing application performance,
I want to visualize the loading waterfall of network resources (JS, CSS, Images, API calls),
So that I can identify slow assets, blocking requests, and optimization opportunities.

## Acceptance Criteria

### AC 1: Resource Timing Capture
- [ ] System captures `PerformanceResourceTiming` entries for all network requests initiated by the application.
- [ ] Captured data includes: Name (URL), Initiator Type (script, css, xmlhttprequest, fetch, img), Start Time, Duration, Transfer Size.
- [ ] Timing breakdown is captured where available: DNS Lookup, TCP Handshake, Request Start, Response Start, Response End.

### AC 2: Waterfall Visualization Component
- [ ] `WaterfallChart` component renders a Gantt-style chart of resources.
- [ ] X-axis represents time (ms) relative to the start of the session/page load.
- [ ] Y-axis lists resources in chronological order of initiation.
- [ ] Each resource is represented by a bar showing its duration.
- [ ] Hovering over a bar displays a tooltip with detailed timing breakdown (DNS, TCP, TTFB, Download Time).

### AC 3: Filter by Resource Type
- [ ] Users can filter the waterfall view by resource type:
    - All
    - XHR/Fetch
    - JS
    - CSS
    - Images
    - Other

### AC 4: Real-time Updates
- [ ] New network requests appearing during the session are appended to the waterfall chart dynamically.

## Design & Implementation

### Component Structure
- **`WaterfallChart.tsx`**: Main visualization component. Uses `recharts` (custom Bar chart) or a dedicated implementation using `div` bars for better control over Gantt layout.
- **`ResourceEntry.tsx`**: Individual row in the waterfall.

### Data Model
```typescript
interface ResourceItem {
  id: string; // unique ID
  name: string; // truncated URL
  fullUrl: string;
  initiatorType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  breakdown: {
    dns: number;
    tcp: number;
    ttfb: number;
    download: number;
  }
}
```

### Technical Notes
- Use `PerformanceObserver` with `entryTypes: ['resource']`.
- Be mindful of the browser's resource timing buffer size (`performance.setResourceTimingBufferSize`).
- Visualize "blocking" time? (Optional enhancement: coloring the bar differently for wait vs download).


## Tasks / Subtasks

- [ ] **1. Performance Observer Update** (AC1)
  - [x] **1.1. Update usePerformanceObserver**:
    - [x] Modify `client/src/hooks/usePerformanceObserver.ts` to observe `resource` entry types.
    - [x] Capture detailed timing data (DNS, TCP, Request, Response).
    - [x] Filter out insignificant/internal requests if needed.

- [ ] **2. Resource Store Update** (AC1, AC4)
  - [x] **2.1. Update performanceStore**:
    - [x] Add `resources` array to state.
    - [x] Add `addResource` action.
    - [x] Define `ResourceTiming` interface matching captured data.

- [ ] **3. Waterfall Component** (AC2)
  - [x] **3.1. WaterfallChart Component**:
    - [x] Create `client/src/components/performance/WaterfallChart.tsx`.
    - [x] Implement gantt-style visualization using `recharts` or custom CSS grid/flex.
    - [x] Implement tooltip hover behavior.

- [ ] **4. Filtering and Integration** (AC3, AC4)
- [x] **4. Filtering and Integration** (AC3, AC4)
  - [x] **4.1. Filter Controls**:
    - [x] Add filter UI (Select/Tabs) for resource types (JS, CSS, Img, XHR).
    - [x] Implement filtering logic in component or store selector.
  - [x] **4.2. Dashboard Integration**:
    - [x] Add `WaterfallChart` to `PerformanceDashboard.tsx`.

- [x] **5. Testing**
  - [x] **5.1. Unit Tests**:
    - [x] Update `client/src/store/performanceStore.test.ts` to test resource accumulation and limits.
    - [x] Create simple verification tests for `usePerformanceObserver` if possible (or rely on integration).
  - [x] **5.2. Component Tests**:
    - [x] Create `client/src/components/performance/WaterfallChart.test.tsx` to verify rendering and filtering.

- [x] **6. Documentation** (AC5)
  - [x] **6.1. Update Documentation**:
    - [x] Document usage of `usePerformanceObserver` and `WaterfallChart` components.

## Dependencies
- Epic 1 (Project Setup)
- `usePerformanceObserver` hook (from Story 4.1 or created here if 4.1 not done, but 4.1 is done).
