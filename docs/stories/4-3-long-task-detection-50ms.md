# Story 4.3: Long Task Detection (>50ms)

Status: ready-for-dev

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

- [ ] **1. Performance Observer Hook** (AC1, AC2)
  - [ ] **1.1. create usePerformanceObserver**:
    - [ ] Create `client/src/hooks/usePerformanceObserver.ts`.
    - [ ] Implement `PerformanceObserver` logic for `entryTypes: ['longtask']`.
    - [ ] Handle browser compatibility (try-catch block).

- [ ] **2. Store Updates** (AC5)
  - [ ] **2.1. Update performanceStore**:
    - [ ] Update `client/src/store/performanceStore.ts`.
    - [ ] Add `LongTask` interface (startTime, duration, attribution).
    - [ ] Add `longTasks` array to state.
    - [ ] Add `addLongTask` action with limit (FIFO 50 items).

- [ ] **3. UI Components** (AC3, AC4)
  - [ ] **3.1. LongTaskFeed Component**:
    - [ ] Create `client/src/components/performance/LongTaskFeed.tsx`.
    - [ ] Render list of tasks using `shadcn/ui` ScrollArea or Table.
    - [ ] Format duration with color coding (>50ms yellow, >100ms red).
  - [ ] **3.2. Dashboard Integration**:
    - [ ] Update `client/src/components/performance/PerformanceDashboard.tsx`.
    - [ ] Add `LongTaskFeed` to layout (e.g., side panel or bottom row).

- [ ] **4. Testing**
  - [ ] **4.1. Unit Tests**:
    - [ ] Test `performanceStore` limit logic (add 51 items, ensure 50 remain).
  - [ ] **4.2. Simulation**:
    - [ ] Create a "Debug Trigger" (hidden or dev-only) to intentionally block main thread for 100ms to verify detection (optional but recommended for verification).

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

### File List

## Learnings from Previous Story

**From Story 4.1: Core Web Vitals Monitoring (Status: done)**

- **New Store**: `performanceStore.ts` exists in `client/src/store/`. Extend this store, do not create a new one.
- **Persistence**: Store uses `persist` middleware - ensure `longTasks` are included or excluded based on memory size considerations (AC5 says persist session, maybe standard persist is fine for 50 items).
- **Architecture**: `PerformanceDashboard.tsx` exists. Add the new component to it.
