# Tech-Spec: Forensic Investigation & Timeline Analysis (Epic 5)

**Created:** 2025-12-06
**Status:** Ready for Development

## Overview

### Problem Statement
Security analysts and forensic investigators need a mechanism to reconstruct the sequence of events from captured network traffic to understand attacks and suspicious activities. They also require robust evidence management (chain of custody) to ensure findings are legally admissible and integrity is maintained throughout the analysis process. Current packet-list views are insufficient for understanding temporal relationships and tracking investigative steps.

### Solution
Implement a comprehensive forensic analysis suite including:
1.  **Interactive Timeline:** A visual, chronological representation of packets and events with zoom/pan capabilities.
2.  **Event Correlation:** Automated linking of related packets (e.g., TCP sessions, request/response pairs).
3.  **Forensic Management:** A legally compliant Chain of Custody log, evidence exporting, and reporting tools.

### Scope (In/Out)
**In Scope:**
-   Chronological visualization of packet data.
-   Interactive timeline controls (zoom, pan, filter).
-   TCP stream reconstruction and conversation flow identification.
-   User annotations (bookmarks, notes) on the timeline.
-   Chain of custody logging for all file actions.
-   Forensic report generation (PDF/HTML).
-   Evidence package export (ZIP with hashes).

**Out Scope:**
-   Real-time streaming timeline updates (Deferred to Epic 8).
-   Server-side evidence storage (LocalBrowser storage only for this epic).
-   Integration with external case management systems (e.g., TheHive).

## Context for Development

### Codebase Patterns
-   **Frontend:** React + Vite + Tailwind CSS + shadcn/ui.
-   **State Management:** Zustand for timeline state (zoom level, viewport).
-   **Data Visualization:** Recharts or VisX for timeline charts.
-   **Data Storage:** `localStorage` / `IndexedDB` for chain of custody and annotations.

### Files to Reference
-   `docs/epics.md` (FR49-FR62).
-   `client/src/services/chainOfCustodyDb.ts` (Existing basic implementation from Story 1.5).
-   `client/src/components/PacketList.tsx` (Source of packet data).

### Technical Decisions
-   **Timeline Library:** Use a specialized timeline library or custom SVG/Canvas component for performance with large datasets (>10k events). `vis-timeline` or similar is recommended.
-   **Correlation IDs:** Add a `flowId` or `streamId` to parsed packets to group them efficiently.
-   **Audit Trail:** Extend the existing Chain of Custody service to log *all* user actions (filtering, bookmarking, exporting), not just file uploads.

## Implementation Plan

### Tasks

-   [ ] **Task 1: Timeline Visualization Component**
    -   Implement `TimelineView` component.
    -   Visualize packet density/volume over time.
    -   Add zoom and pan controls.
-   [ ] **Task 2: Event Correlation Engine**
    -   Implement logic to group packets into flows (5-tuple).
    -   Identify start/end of connections.
    -   Correlate request/response pairs (HTTP, DNS).
-   [ ] **Task 3: Interactive Timeline Features**
    -   Add support for bookmarking specific timestamps/packets.
    -   Allow adding text notes/annotations to events.
    -   Implement filtering by protocol and thread severity.
-   [ ] **Task 4: Enhanced Chain of Custody**
    -   Expand `ChainOfCustodyService` to track analysis actions.
    -   Ensure immutable logging (timestamp, action, user, hash).
-   [ ] **Task 5: Reporting & Export**
    -   Create `ForensicReportGenerator` service.
    -   Implement "Export Evidence Package" (ZIP containing PCAP + JSON metadata + Report).

### Acceptance Criteria

-   [ ] **AC 1:** System generates a scalable chronological timeline of all loaded packets.
-   [ ] **AC 2:** Users can zoom in to millisecond precision and pan across the entire capture duration.
-   [ ] **AC 3:** Related packets (TCP streams) are visually grouped or linked.
-   [ ] **AC 4:** Users can add bookmarks and notes to specific points on the timeline.
-   [ ] **AC 5:** Chain of custody log records every significant user action (filter change, export, annotation).
-   [ ] **AC 6:** Evidence export produces a ZIP file containing the PCAP, a metadata manifest, and the chain of custody log, all cryptographically hashed.
-   [ ] **AC 7:** Forensic report includes summary, timeline of key events, analyst notes, and identified threats.

## Additional Context

### Dependencies
-   Requires parsed packet data (Epic 1).
-   Requires Threat Detection (Epic 3) for threat-based filtering.

### Testing Strategy
-   **Unit Tests:** Verify correlation logic (correctly groups stream packets).
-   **Component Tests:** Test timeline interaction (zoom/pan updates view).
-   **E2E Tests:** Simulate a forensic workflow: Import PCAP -> Analyze -> Annotate -> Export Evidence.

### Notes
-   Timeline performance is critical. For large PCAPs, consider using `canvas` instead of DOM elements for individual events.
-   Ensure Chain of Custody timestamps are strictly UTC.
