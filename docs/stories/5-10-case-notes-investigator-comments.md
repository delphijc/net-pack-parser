# Story 5.10: Case Notes & Investigator Comments

**Story ID:** 5.10
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As an investigator,
I want a dedicated space to write high-level case objectives and summaries,
So that the context of the investigation is preserved alongside the technical evidence.

## Acceptance Criteria

### AC 1: Case Details Form
- [ ] Input fields for: Case Name, Case Number/ID, Investigator Name, Organization.

### AC 2: Executive Summary Editor
- [ ] Rich text (or Markdown) editor for writing the "Executive Summary" of findings.
- [ ] Autosaves content.

### AC 3: Integration
- [ ] This content is included in the Report (Story 5.9) and Evidence Package (Story 5.8).

## Design & Implementation

### Component Structure
- **`CaseInfoPanel.tsx`**: Form inputs.
- **`SummaryEditor.tsx`**: Text area.

### Data Model
```typescript
interface CaseMetadata {
  caseId: string;
  investigator: string;
  summary: string;
  startDate: string;
}
```
