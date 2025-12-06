# Story 5.7: Chain of Custody Logging & Audit Trail

**Story ID:** 5.7
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As a forensic investigator,
I need every action I take (filtering, annotating, exporting) to be logged in an immutable audit trail,
So that I can prove the integrity of my analysis in court.

## Acceptance Criteria

### AC 1: Comprehensive Logging
- [ ] System automatically logs the following events:
    - File Loading (already done in 1.4, verify integration).
    - Filter Application (Start/End time, Protocol).
    - Annotation Creation/Edit.
    - Bookmark Creation.
    - Threat Detection Acknowledgment.
    - Report/Evidence Export.

### AC 2: Immutable Record
- [ ] Each log entry includes: Timestamp (UTC), Action Type, User (if auth), Description, Hash of affected data (if applicable).
- [ ] Logs cannot be deleted or modified by the user via the UI.

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
