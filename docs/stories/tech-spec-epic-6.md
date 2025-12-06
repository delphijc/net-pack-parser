# Tech-Spec: Visualization, Reporting & Export (Epic 6)

**Created:** 2025-12-06
**Status:** Ready for Development

## Overview

### Problem Statement
While users can analyze individual packets, they lack high-level visibility into network traffic patterns. They need aggregated views to quickly identify anomalies (e.g., protocol distribution, top talkers). Furthermore, professional users need to export their findings and raw data in standard formats for reporting and external tool integration.

### Solution
Implement a comprehensive visualization dashboard and reporting/export engine:
1.  **Dashboard:** Interactive charts for Protocol Distribution, Traffic Volume, Top Talkers, and Geo-IP mapping.
2.  **Reporting:** Customizable PDF/HTML reports summarizing analysis findings.
3.  **Export:** Robust export options for raw data (CSV, JSON) and charts (PNG/SVG).

### Scope (In/Out)
**In Scope:**
-   Protocol distribution charts (Pie/Bar).
-   Traffic volume over time (Line/Area).
-   Top Talkers analysis (Table/Bar).
-   Geographic distribution map (using GeoIP database).
-   Export charts as images.
-   Generate summaries and custom reports.
-   Export packets/threats to CSV and JSON.
-   Filtered data export.

**Out Scope:**
-   Real-time streaming visualization updates (Epic 8).
-   Server-side report generation (Client-side generation preferred for privacy).

## Context for Development

### Codebase Patterns
-   **Frontend:** React + Vite + Tailwind CSS + shadcn/ui.
-   **Charts:** Use `recharts` for standard charts, `react-simple-maps` or similar for GeoIP.
-   **PDF Generation:** `jspdf` or `react-pdf`.
-   **Export:** `file-saver` for client-side downloads.

### Files to Reference
-   `docs/epics.md` (FR63-FR75).
-   `client/src/services/pcapParser.ts` (Data source).
-   `client/src/components/Dashboard.tsx` (Current skeleton).

### Technical Decisions
-   **GeoIP:** Use a lightweight browser-compatible GeoIP database (e.g., `mmdb-lib`) or a privacy-preserving external API (if allowed, usually browser-only preferred so local DB is better). *Decision: Use local Lite MMDB if possible, or simple country code mapping to keep it offline.*
-   **Export:** Ensure CSV/JSON exports are generally streaming or chunked to handle large datasets without crashing.

## Implementation Plan

### Tasks

-   [ ] **Task 1: visualization Component Library**
    -   Create reusable chart components (Pie, Bar, Line) using `recharts`.
    -   Implement color themes matching the "Deep Dive" aesthetic.
-   [ ] **Task 2: Dashboard Implementation**
    -   Build `ProtocolDistribution`, `TrafficVolume`, `TopTalkers` widgets.
    -   Integrate `GeoMap` for IP visualization.
-   [ ] **Task 3: Export Engine**
    -   Implement `DataExportService` for CSV and JSON.
    -   Support "Export All" vs "Export Filtered".
    -   Add `Hash` integrity check to export metadata.
-   [ ] **Task 4: Reporting Module**
    -   Create `ReportBuilder` component.
    -   Allow users to select sections (Executive Summary, Charts, Top Threats).
    -   Generate PDF output.

### Acceptance Criteria

-   [ ] **AC 1:** Dashboard displays accurate Protocol, Volume, and Top Talker charts based on loaded packets.
-   [ ] **AC 2:** Users can interact with charts (hover details, click to filter).
-   [ ] **AC 3:** Geographic map visualizes IP distribution (using local DB or offline mapping).
-   [ ] **AC 4:** Users can download individual charts as PNG/SVG.
-   [ ] **AC 5:** "Export CSV" and "Export JSON" produce valid files containing all (or filtered) packet data.
-   [ ] **AC 6:** Report generator produces a professional PDF summary including selected visual elements and analysis notes.
-   [ ] **AC 7:** All exports preserve data integrity verification via included file hashes.

## Additional Context

### Dependencies
-   Requires parsed packet data (Epic 1).

### Testing Strategy
-   **Unit Tests:** Verify data aggregation logic for charts (e.g., ensure protocol counts sum correctly).
-   **Manual Verification:** Verify PDF layout and content.
-   **Performance Testing:** Ensure dashboard renders < 1s for 50k packets.

### Notes
-   Top Talkers should resolve hostnames if DNS packets are present (optional enhancement).
-   GeoIP lookups should be non-blocking.
