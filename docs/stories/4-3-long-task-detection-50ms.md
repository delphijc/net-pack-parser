# Story 4.3: Long Task Detection (>50ms)

Status: done

## Story

As a developer,
I want to detect and log tasks that block the main thread for more than 50ms,
so that I can identify code execution that causes UI freezes and poor responsiveness.

## Acceptance Criteria

1.  **Detection**: The system listens for `longtask` PerformanceEntries using a specific observer.
2.  **Threshold**: Any task taking >50ms (the browser standard for long tasks) is captured.
3.  **Visualization**: A "Main Thread Blocking" feed (list) displays detected long tasks.
4.  **Details**: Each entry shows:
    *   Duration (ms)
    *   Start Time
    *   Attribution (script URL or container that caused it, if available).
5.  **Persistence**: Long tasks are stored in the session performance store (max 50 entries to prevent memory leaks).

## Tasks / Subtasks

- [x] **1. Performance Observer Hook** (AC1, AC2)
  - [x] **1.1. create usePerformanceObserver**:
    - [x] Create `client/src/hooks/usePerformanceObserver.ts`.
    - [x] Implement `PerformanceObserver` logic for `entryTypes: ['longtask']`.
    - [x] Handle browser compatibility (try-catch block).

- [x] **2. Store Updates** (AC5)
  - [x] **2.1. Update performanceStore**:
    - [x] Update `client/src/store/performanceStore.ts`.
    - [x] Add `LongTask` interface (startTime, duration, attribution).
    - [x] Add `longTasks` array to state.
    - [x] Add `addLongTask` action with limit (FIFO 50 items).

- [x] **3. UI Components** (AC3, AC4)
  - [x] **3.1. LongTaskFeed Component**:
    - [x] Create `client/src/components/performance/LongTasksView.tsx`.
    - [x] Render list of tasks using `shadcn/ui` ScrollArea or Table.
    - [x] Format duration with color coding (>50ms yellow, >100ms red).
  - [x] **3.2. Dashboard Integration**:
    - [x] Update `client/src/components/performance/PerformanceDashboard.tsx`.
    - [x] Add `LongTaskFeed` to layout (e.g., side panel or bottom row).

- [x] **4. Testing**
  - [x] **4.1. Unit Tests**:
    - [x] Test `performanceStore` limit logic (add 51 items, ensure 50 remain).
  - [x] **4.2. Simulation**:
    - [x] Create a "Debug Trigger" (hidden or dev-only) to intentionally block main thread for 100ms to verify detection (optional but recommended for verification).

## Dev Notes

- **Architecture**:
  - `longtask` entries are distinct from `web-vitals`. They require a raw `PerformanceObserver`.
  - **Attribution**: Often empty in cross-origin scripts, but useful for local. handle empty attribution gracefully.

### References

- [Source: docs/stories/tech-spec-epic-4.md#Detailed Design]

## Dev Agent Record

### Context Reference

- [Context File](docs/stories/4-3-long-task-detection-50ms.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

- Implemented `usePerformanceObserver` hook.
- Updated `performanceStore` with `longTasks` state and limit logic.
- Created `LongTasksView` with `ScrollArea`.
- Integrated into `PerformanceDashboard`.
- Added unit tests for store logic.

### File List

- client/src/hooks/usePerformanceObserver.ts
- client/src/store/performanceStore.ts
- client/src/store/performanceStore.test.ts
- client/src/components/performance/LongTasksView.tsx
- client/src/components/ui/scroll-area.tsx
- client/src/components/performance/PerformanceDashboard.tsx

## Learnings from Previous Story

**From Story 4.1: Core Web Vitals Monitoring (Status: done)**

- **New Store**: `performanceStore.ts` exists in `client/src/store/`. Extend this store, do not create a new one.
- **Persistence**: Store uses `persist` middleware - ensure `longTasks` are included or excluded based on memory size considerations (AC5 says persist session, maybe standard persist is fine for 50 items).
- **Architecture**: `PerformanceDashboard.tsx` exists. Add the new component to it.

## Senior Developer Code Review
**Review Date:** 2025-12-06
**Reviewer:** Senior Dev AI
**Status:** APPROVED

### Summary
The implementation successfully introduces Long Task detection using the `PerformanceObserver` API. The solution is performant, using a fixed-size buffer in the store to prevent memory leaks, and integrates well with the existing dashboard.

### Findings
1.  **Correctness**:
    -   `usePerformanceObserver` correctly targets `longtask` entries.
    -   `performanceStore` logic guarantees a strict limit of 50 items (LIFO presentation, FIFO storage).
    -   Browser support check prevents crashes in unsupported environments.
2.  **Code Quality**:
    -   Clean separation of concerns (Hook -> Store -> View).
    -   Defensive coding in `usePerformanceObserver` regarding `attribution` property access.
3.  **UX**:
    -   Effective use of color coding (Yellow/Red) to highlight severity.
    -   Empty state handled gracefully.

### Recommendations
-   **Future**: Consider adding a "Clear" button for long tasks specifically, though `Reset Metrics` currently clears all, which is acceptable for now.

## Change Log
-   Added `usePerformanceObserver.ts` hook.
-   Updated `performanceStore.ts` with LongTask state.
-   Added `LongTasksView.tsx` component.
-   Updated `PerformanceDashboard.tsx` to include the new view.
