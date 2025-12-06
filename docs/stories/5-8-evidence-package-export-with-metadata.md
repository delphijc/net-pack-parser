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
- [ ] "Export Evidence" button generates a ZIP file.
- [ ] ZIP contains:
    - `evidence.pcap` (The original file).
    - `case-metadata.json` (Investigator info, timestamps).
    - `chain-of-custody.json` (Full audit log).
    - `annotations.json` (Bookmarks and notes).

### AC 2: Integrity Hashing
- [ ] The system calculates a SHA-256 hash of the final ZIP file.
- [ ] System offers to download a separate `.sha256` text file or displays the hash for verification.

## Design & Implementation

### Component Structure
- **`ExportControl.tsx`**: Button and progress indicator.
- **`EvidencePackager.ts`**: Service to assemble ZIP.

### Libraries
- `jszip` or `fflate` for browser-side zipping.

## Dependencies
- Story 5.7 (Chain of Custody data).
