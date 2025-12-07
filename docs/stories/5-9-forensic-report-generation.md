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

## Senior Developer Review (AI)

| Criteria | Assessment | Notes |
| :--- | :--- | :--- |
| **Code Quality** | Approved | `ReportGenerator` service separates logic well. Components are modular. |
| **Functionality** | Approved | Report generation for HTML and PDF implemented. Preview available. |
| **Testing** | Approved | Unit tests cover data collection and HTML formatting. |
| **Security** | Approved | No sensitive data exposed externally; local generation only. |

## Action Items
- None.

## Tasks/Subtasks
- [x] Dependencies
    - [x] Install `jspdf` and `html2canvas`.
    - [x] Install `@types/jspdf` and `@types/html2canvas`.
- [x] Core Logic
    - [x] Create `client/src/services/ReportGenerator.ts` service.
    - [x] Implement data collection (Metadata, Summary, Stats, Threats, CoC).
    - [x] Implement HTML/PDF generation logic (using `jspdf` or browser print).
- [x] UI Components
    - [x] Create `client/src/components/ReportPreview.tsx`.
    - [x] Create `client/src/components/ReportGeneratorControl.tsx` (Button/Modal).
    - [x] Add to `FilesTab.tsx` or `PacketAnalysis` (Added to `PcapUpload.tsx`).
- [x] Verification
    - [x] Verify generated HTML contains Case ID, Threat Summary, and CoC log.
    - [x] Verify PDF generation works (mocked/basic check).

## Dependencies
- All previous Epic 5 stories (to populate the report).
