# Story 6.6: Summary Report Generation

**Story ID:** 6.6
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Ready for Development

## User Story

As an analyst,
I want a one-click "Generate Summary" button,
So that I can get a quick overview document of the capture without manual composition.

## Acceptance Criteria

### AC 1: Content
- [ ] Standard template includes:
    - File Name, SHA256 Hash, Capture Duration.
    - Total Packets, Bytes, Flow Count.
    - Protocol Distribution Chart.
    - Top 5 Talkers.

### AC 2: Output
- [ ] Generates a single-page PDF.

## Design & Implementation

### Component Structure
- **`ReportService.ts`**: (Reused/Extended from Story 5.9).

## Dependencies
- Epic 1.
