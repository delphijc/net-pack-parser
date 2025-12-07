# Story 5.8: Evidence Package Export with Metadata

**Story ID:** 5.8
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As an investigator,
I want to export the original PCAP along with my analysis notes and audit log in a single secure package,
So that I can hand off the case or archive it with full context.

## Acceptance Criteria

### AC 1: ZIP Package Creation
- [x] "Export Evidence" button generates a ZIP file.
- [x] ZIP contains:
    - `evidence.pcap` (The original file).
    - `case-metadata.json` (Investigator info, timestamps).
    - `chain-of-custody.json` (Full audit log).
    - `annotations.json` (Bookmarks and notes).

### AC 2: Integrity Hashing
- [x] The system calculates a SHA-256 hash of the final ZIP file.
- [x] System offers to download a separate `.sha256` text file or displays the hash for verification.

## Tasks/Subtasks
- [x] Core Logic
    - [x] Install `jszip` and types.
    - [x] Create `client/src/services/EvidencePackager.ts` service.
    - [x] Implement metadata collection (Session, CoC, Annotations).
    - [x] Implement ZIP generation and Hashing.
- [x] UI Components
    - [x] Create `client/src/components/ExportControl.tsx`.
    - [x] Integration: Add `ExportControl` to `PcapUpload.tsx` (top bar).
- [x] Verification
    - [x] Verify ZIP structure and content.
    - [x] Verify Hash correctness.

## Design & Implementation

### Component Structure
- **`ExportControl.tsx`**: Button and progress indicator.
- **`EvidencePackager.ts`**: Service to assemble ZIP.

### Libraries
- `jszip` or `fflate` for browser-side zipping.

## File List
- client/package.json
- client/src/services/EvidencePackager.ts (New)
- client/src/components/ExportControl.tsx (New)
- client/src/components/parser/PcapUpload.tsx
- client/src/services/EvidencePackager.test.ts (New)

## Dependencies
- Story 5.7 (Chain of Custody data).

## Senior Developer Review (AI)
- **Status**: Approved
- **Date**: 2025-12-07
- **Reviewer**: Antigravity
- **Notes**:
    - Implementation meets all acceptance criteria.
    - `EvidencePackager` service correctly encapsulates the zipping and hashing logic.
    - `ExportControl` provides necessary UI feedback (loading state, hash display).
    - Unit tests cover key scenarios including missing sessions.
    - **Performance Note**: Generating SHA-256 for very large PCAP files (>100MB) on the main thread might cause temporary UI freeze. This is acceptable for the current MVP but should be noted for future optimization (e.g., Web Workers).
- **Action Items**:
    - None. Ready for merge.
