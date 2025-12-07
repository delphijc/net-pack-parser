# Story 5.7: Chain of Custody Logging & Audit Trail

**Story ID:** 5.7
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Done

## User Story

As a forensic investigator,
I need every action I take (filtering, annotating, exporting) to be logged in an immutable audit trail,
So that I can prove the integrity of my analysis in court.

## Acceptance Criteria

### AC 1: Comprehensive Logging
- [x] System automatically logs the following events:
    - File Loading (already done in 1.4, verify integration).
    - Filter Application (Start/End time, Protocol).
    - Annotation Creation/Edit.
    - Bookmark Creation.
    - Threat Detection Acknowledgment.
    - Report/Evidence Export.

### AC 2: Immutable Record
- [x] Each log entry includes: Timestamp (UTC), Action Type, User (if auth), Description, Hash of affected data (if applicable).
- [x] Logs cannot be deleted or modified by the user via the UI.

## Tasks/Subtasks
- [x] Data Model & Storage
    - [x] Refactor `types/index.ts`: Rename/Broaden `FileChainOfCustodyEvent` to `ChainOfCustodyEvent`.
    - [x] Update `chainOfCustodyDb.ts` to use new type.
    - [x] Create `useAuditLogger` hook for consistent logging.
- [x] UI Components
    - [x] Update `ChainOfCustodyLog.tsx` to display new event types (Action, Details, Timestamp).
- [x] Integration (Logging Points)
    - [x] `AnnotationPanel.tsx` -> Log Bookmark/Annotation creation.
    - [x] `TimelineControls.tsx` -> Log Filter changes.
    - [x] `PcapUpload.tsx` -> Ensure File Uploads still log correctly.
- [x] Verification
    - [x] Perform actions (Filter, Bookmark) and verify entries in "Chain of Custody" log.
    - [x] Verify persistence (refresh page).

## Dev Notes
- `ChainOfCustodyEvent` should likely have: `id`, `timestamp`, `action`, `details`, `user`, `hash` (optional).
- `PcapUpload` currently calls `db.addFileChainOfCustodyEvent` directly. Need to update this call.

## File List
- client/src/types/index.ts
- client/src/services/chainOfCustodyDb.ts
- client/src/components/ChainOfCustodyLog.tsx
- client/src/hooks/useAuditLogger.ts (New)
- client/src/components/TimelineControls.tsx
- client/src/components/AnnotationPanel.tsx
- client/src/components/parser/PcapUpload.tsx
- client/src/components/TimelineView.tsx
- client/src/components/ThreatPanel.tsx
- client/src/components/FilesTab.tsx

## Change Log
- Refactored `FileChainOfCustodyEvent` to `ChainOfCustodyEvent` in `client/src/types/index.ts`.
- Updated `chainOfCustodyDb.ts` to support generic events.
- Added `useAuditLogger` hook in `client/src/hooks/useAuditLogger.ts`.
- Integrated logging into `TimelineControls.tsx`, `AnnotationPanel.tsx`, `TimelineView.tsx`, and `PcapUpload.tsx`.
- Updated `ChainOfCustodyLog.tsx` to render generic events.

## Senior Developer Review (AI)
- **Date:** 2025-12-07
- **Outcome:** Approved with Fixes
- **Summary:** Initial review found missing Threat Logging (AC 1) and inconsistent DB usage in FilesTab.
    - **Fixes Applied:**
        - Added logging to `ThreatPanel.tsx` for threat confirmation/FP marking.
        - Refactored `FilesTab.tsx` to use `useAuditLogger` hook.
        - Updated documentation to include all modified files.

### Action Items
- [ ] None.

## Review Follow-ups (AI)
- [ ] None.

### AC 3: UI View
- [ ] A "Chain of Custody" tab displays the chronological log of all actions for the current session.

## Design & Implementation

### Component Structure
- **`ChainOfCustodyLog.tsx`**: (Existing) Update to show new event types.
- **`chainOfCustodyDb.ts`**: Update schema to support new event types.

### Data Model
```typescript
interface ChainEvent {
  id: string;
  timestamp: string; // ISO UTC
  action: 'FILTER' | 'ANNOTATE' | 'EXPORT' | 'LOAD';
  details: string;
  hash?: string;
}
```

## Dependencies
- Story 1.5 (Foundation).
