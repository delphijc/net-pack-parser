# Story 5.10: Case Notes & Investigator Comments

**Story ID:** 5.10
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Done

## User Story

As an investigator,
I want a dedicated space to write high-level case objectives and summaries,
So that the context of the investigation is preserved alongside the technical evidence.

## Acceptance Criteria

### AC 1: Case Details Form
- [x] Input fields for: Case Name, Case Number/ID, Investigator Name, Organization.

### AC 2: Executive Summary Editor
- [x] Rich text (or Markdown) editor for writing the "Executive Summary" of findings.
- [x] Autosaves content.

### AC 3: Integration
- [x] This content is included in the Report (Story 5.9) and Evidence Package (Story 5.8).

## Design & Implementation

### Component Structure
- **`CaseInfoPanel.tsx`**: Form inputs.
- **`SummaryEditor.tsx`**: Text area.

### Data Model
```typescript
interface CaseMetadata {
  caseId: string;
  caseName: string;
  investigator: string;
  organization: string;
  summary: string;
  startDate: string;
}
```

## Tasks/Subtasks
- [x] Core Logic & State Management
    - [x] Define `CaseMetadata` types in `client/src/types/forensics.ts`.
    - [x] Update `SessionStore` or `ForensicStore` to manage `CaseMetadata`.
- [x] UI Components
    - [x] Create `client/src/components/CaseInfoPanel.tsx` (AC1).
    - [x] Create `client/src/components/SummaryEditor.tsx` (AC2).
    - [x] Integrate components into a "Case Management" or "Forensics" tab in `App.tsx` or `PcapUpload.tsx`.
- [x] Integration
    - [x] Update `ReportGenerator.ts` to include Case Metadata and Summary (AC3).
    - [x] Update `EvidencePackager.ts` to include Case Metadata in export (AC3).
- [x] Verification
    - [x] Verify form inputs are preserved.
    - [x] Verify executive summary editor works (autosave/persistence).
    - [x] Verify generated report includes the new metadata and summary.
    - [x] Verify evidence package includes the metadata.

## Dev Notes
- **Architecture**:
    - Store case metadata in `ForensicStore` (Zustand) for persistence.
    - Use `shadcn/ui` components for inputs (`Input`, `Label`, `Textarea`).
    - Integrated as a `Sheet` (Side Panel) in `PcapUpload` to keep the main view clean.
- **Persistence**:
    - The `ForensicStore` is already persisted via `persist` middleware, ensuring autosave.

## Senior Developer Review (AI)
- **Implementation**: The implementation follows the design pattern used in other components. Zustand stores handle state effectively.
- **Integration**: The "Case Details" Sheet provides a non-intrusive way to manage metadata.
- **Testing**: Comprehensive tests were added for `ForensicStore`, `ReportGenerator`, and `EvidencePackager` covering all new functionality.
- **Security**: Inputs are standard text fields; `ReportGenerator` uses proper interpolation (and iframe sandbox for preview) ensuring safety.
- **Status**: Approved.

## Dev Agent Record
### Completion Notes
- All ACs met. Tests passing.

## File List
- `client/src/components/CaseInfoPanel.tsx`
- `client/src/components/SummaryEditor.tsx`
- `client/src/components/parser/PcapUpload.tsx`
- `client/src/services/ReportGenerator.ts`
- `client/src/services/EvidencePackager.ts`
- `client/src/store/forensicStore.ts`
- `client/src/types/forensics.ts`

## Change Log
- (Auto-generated)
