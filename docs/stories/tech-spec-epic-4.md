# Epic Technical Specification: Performance Monitoring Dashboard

Date: 2025-12-06
Author: delphijc
Epic ID: 4
Status: Draft

---

## Overview

The **Performance Monitoring Dashboard** epic aims to provide developers with real-time insight into the frontend performance of the application or the analyzed network traffic context. By leveraging modern browser Performance APIs, this feature will track and visualize Core Web Vitals (LCP, FCP, CLS, INP, TTFB), navigation timings, and resource loading waterfalls. This enables users to immediately correlate network behavior with actual user experience metrics.

This epic aligns with the "Real-Time Performance Monitoring" capability defined in the PRD and leverages the browser-only architecture to ensure privacy and low overhead.

## Objectives and Scope

**In-Scope:**
- **Core Web Vitals Tracking:** Real-time monitoring of LCP, FCP, CLS, INP, and TTFB.
- **Performance Scoring:** Calculation of a composite 0-100 performance score based on Vitals.
- **Navigation Timing:** Visualization of page load phases (DNS, TCP, Request, Response, DOM Processing, Load).
- **Resource Waterfall:** Visualization of network requests (JS, CSS, Images, XHR) with timing details.
- **Long Task Detection:** Identification and logging of Main Thread blocking tasks >50ms.
- **Historical Trends:** Visualization of performance metrics over the current session (time-series).
- **Filtering:** Ability to filter resource views by type or duration.

**Out-of-Scope:**
- Server-side performance monitoring (APM).
- Cross-user Real User Monitoring (RUM) aggregation (data remains local).
- Distributed tracing integration.
- Performance monitoring of the *Capture Agent* (this is separate NFR tracking).

## System Architecture Alignment

This implementation will introduce a new `Performance` module within the Client application.

- **Components:**
    - `PerformanceDashboard.tsx`: Main container view.
    - `VitalsCard.tsx`: Reusable component for individual metrics (LCP, FCP, etc.) with radial progress indicators.
    - `WaterfallChart.tsx`: Visualization component for Resource Timing.
    - `TrendGraph.tsx`: Recharts-based time-series view for metrics.
    - `LongTaskFeed.tsx`: List view of detected long tasks.
- **Hooks:**
    - `usePerformanceObserver.ts`: Custom hook to manage `PerformanceObserver` subscriptions and state updates.
    - `useWebVitals.ts`: Wrapper around standard `web-vitals` library for normalized metric reporting.
- **Storage:**
    - `localStorage` (via `useLocalStorage`) for persisting session metric history if needed across reloads.
- **Design System:**
    - Utilization of `shadcn/ui` cards, badges, and tables for consistency.
    - "Deep Blue" and "Teal" theming for charts.

## Detailed Design

### Services and Modules

| Module | Responsibility | Key Inputs | Key Outputs |
| :--- | :--- | :--- | :--- |
| **PerformanceObserver Hook** | specific listeners for 'paint', 'largest-contentful-paint', 'layout-shift', 'longtask', 'resource' | Browser Performance API | `PerformanceEntry[]` stream |
| **Vitals Aggregator** | Normalizes raw entries into score-ready metrics | `PerformanceEntry` stream | `Metric` objects (value, rating) |
| **Trend Analyzer** | Maintains a circular buffer of metric history for charting | Current metrics | `HistoryPoint[]` for charts |
| **Waterfall Builder** | Transforms Resource Timing entries into Gantt-chart friendly data | `PerformanceResourceTiming` entries | `WaterfallItem[]` (start, duration, blocking) |

### Data Models and Contracts

**Metric Interface:**
```typescript
interface Metric {
  name: 'LCP' | 'FCP' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number; // Change since last update
  id: string; // Unique metric ID
  entries: PerformanceEntry[];
}
```

**Long Task Interface:**
```typescript
interface LongTask {
  startTime: number;
  duration: number;
  attribution: TaskAttributionTiming[];
}
```

**Resource Item:**
```typescript
interface ResourceItem {
  name: string;
  initiatorType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  // Timing details
  dnsDuration: number;
  tcpDuration: number;
  requestDuration: number;
  responseDuration: number;
}
```

### APIs and Interfaces

*No external Server APIs are required for this Browser-Only Epic.*

**Browser Interfaces Used:**
- `window.performance`
- `PerformanceObserver`
- `PerformanceNavigationTiming`
- `PerformanceResourceTiming`
- `PerformanceLongTaskTiming`

### Workflows and Sequencing

1.  **Dashboard Load:**
    - `PerformanceDashboard` mounts.
    - `usePerformanceObserver` initializes.
    - Checks browser support (`PerformanceObserver.supportedEntryTypes`).
    - Subscribes to entry types.
    - Loads any persisted history from `localStorage`.

2.  **Real-time Update:**
    - Browser emits `layout-shift` (CLS) event.
    - Observer callback fires.
    - `Metric` state updated.
    - `PerformanceScore` recalculated.
    - `VitalsCard` re-renders with new value and color (Green/Orange/Red).

3.  **Resource Loading:**
    - Network request completes.
    - `resource` entry buffered.
    - `WaterfallChart` appends new bar item.

## Non-Functional Requirements

### Performance
- **Overhead:** Performance monitoring logic must evaluate in < 5ms per event to prevent observer effect (NFR-P5).
- **Visualization:** Charts (Waterfall/Trend) must handle up to 500 points without UI lag (use virtualization or canvas if necessary, but SVG/Recharts likely sufficient for <1000 items).

### Reliability/Availability
- **Fallback:** Must gracefully degrade on browsers lacking specific APIs (e.g., Safari missing some newer vitals).
- **Error Handling:** `PerformanceObserver` errors must be caught and logged without crashing the dashboard.

### Observability
- **Self-Monitoring:** The dashboard itself should report its own render time (meta-monitoring) to ensure it doesn't degrade app performance.

## Dependencies and Integrations

- **web-vitals** (Google Chrome Lab): Standard library for accurate Core Web Vitals measurement.
- **recharts**: For rendering trend lines and potentially the waterfall chart (bar chart with custom shapes).
- **lucide-react**: Icons for metrics.

## Acceptance Criteria (Authoritative)

1.  **Core Web Vitals Display**
    - [ ] Dashboard displays cards for LCP, FCP, CLS, INP, and TTFB.
    - [ ] Metrics are color-coded based on standard thresholds (Good=Green, Needs Improvement=Orange, Poor=Red).
    - [ ] Values update in real-time as interaction occurs.

2.  **Performance Score**
    - [ ] A proprietary 0-100 Performance Score is calculated and displayed prominently.
    - [ ] Score calculation logic is documented and consistent.

3.  **Resource Waterfall**
    - [ ] A timeline chart displays loaded resources (JS, CSS, Img, Fetch).
    - [ ] Hovering a resource bar shows breakdown: DNS, TCP, Request, Response.

4.  **Long Task Monitor**
    - [ ] Tasks blocking the main thread for >50ms are listed in a "Main Thread Blocking" log.
    - [ ] Log includes timestamp and duration.

5.  **Navigation Timing**
    - [ ] A dedicated visual shows the initial page load phases (DNS -> TCP -> Request -> Response -> Load).

6.  **Historical Trends**
    - [ ] A line chart shows the progression of at least one key metric (e.g., LCP or Memory) over the active session.

## Traceability Mapping

| FR ID | Description | Acceptance Criteria | Component |
| :--- | :--- | :--- | :--- |
| **FR7** | Monitor Core Web Vitals | AC 1 | `VitalsCard`, `useWebVitals` |
| **FR8** | Track Page Load & Nav Timing | AC 5 | `NavigationTimingView` |
| **FR9** | Detect Long Tasks | AC 4 | `LongTaskFeed` |
| **FR10** | Capture Resource Timing | AC 3 | `WaterfallChart` |
| **FR11** | Real-time Dashboard | AC 1, AC 2, AC 6 | `PerformanceDashboard` |
| **FR13** | Performance Score (0-100) | AC 2 | `ScoreGauge` |
| **FR14** | Waterfall Visualization | AC 3 | `WaterfallChart` |

## Risks, Assumptions, Open Questions

- **Risk:** `PerformanceObserver` support varies significantly across browsers (Safari vs Chrome).
    - *Mitigation:* Use `web-vitals` library which handles polyfills and normalization where possible. Show "Not Supported" state for unsupported metrics.
- **Assumption:** The user is interested in the performance of the *Parser Application itself* OR the performance of the *loaded web page* (if we were a browser).
    - *Clarification:* As per PRD "Performance Monitoring Dashboard", this tool monitors the *application's own performance* (to start) but the vision implies monitoring *network traffic performance*.
    - *Correction:* FRs refer to "Core Web Vitals tracking". This implies monitoring the App itself. Wait... FR10 "Capture resource timing for all network requests". If we are analyzing a PCAP, we can't measure "Core Web Vitals" of a recorded session easily (no CLS/INP in PCAP). **CRITICAL DESIGN DECISION**: This Epic 4 seems to monitor the **Net Pack Parser's own performance** (for developers of the tool) or uses the Connected Mode to monitor a live page?
    - *Refinement:* Given FR7 "System continuously monitors Core Web Vitals... for developers", and the context of "Developer Adoption", it's likely monitoring the app itself or a page being "profiled".
    - *Decision:* This spec assumes monitoring the **current application session** (Net Pack Parser) or provides a mode to "instrument" a target. Given the "Browser-Only" nature, it's monitoring *itself*.

## Test Strategy Summary

- **Unit Tests:**
    - Mock `PerformanceObserver` and `window.performance`.
    - Verify `useWebVitals` hook returns correct normalized values.
    - Verify `ScoreGauge` calculation logic.
- **Integration Tests:**
    - Render `PerformanceDashboard` and simulate performance events.
    - Verify updates to Vitals cards and Waterfall tables.
- **Manual Verification:**
    - Use Chrome DevTools "Performance" tab to cross-reference reported values.
    - Induce long tasks (blocking loop) and verify detection.
    - Throttle network to verify Waterfall updates.
