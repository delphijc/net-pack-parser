# Story 5.9: Forensic Report Generation

**Story ID:** 5.9
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As an investigator,
I want to generate a professional PDF or HTML report of my findings,
So that I can present the evidence to non-technical stakeholders or legal teams.

## Acceptance Criteria

### AC 1: Report Structure
- [ ] Generated report includes:
    - Case Metadata (Investigator Name, Date, Case ID).
    - Executive Summary (from Story 5.10).
    - Statistical Summary (Packet count, volume, protocols).
    - Timeline Visualization (Image snapshot).
    - Identified Threats Table.
    - Chain of Custody Log.

### AC 2: Formats
- [ ] Export as **HTML** (self-contained, interactive).
- [ ] Export as **PDF** (printable).

## Design & Implementation

### Component Structure
- **`ReportPreview.tsx`**: WYSIWYG preview of the report.
- **`ReportGenerator.ts`**: Service to render the report.

### Libraries
- `jspdf` for PDF generation, or simply Print-to-PDF styles if focusing on HTML. `html2canvas` for charts.

## Dependencies
- All previous Epic 5 stories (to populate the report).
