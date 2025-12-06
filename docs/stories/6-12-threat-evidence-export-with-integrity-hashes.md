# Story 6.12: Threat Evidence Export with Integrity Hashes

**Story ID:** 6.12
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Ready for Development

## User Story

As an analyst,
I want exported evidence files to include a cryptographic hash,
So that the recipient can verify the files have not been tampered with.

## Acceptance Criteria

### AC 1: Hash Calculation
- [ ] Upon generating any export (CSV, JSON, ZIP), system calculates SHA-256.

### AC 2: Verification File
- [ ] System generates a companion `.sha256` file or `manifest.json` containing the hash.

## Dependencies
- Story 6.8, 6.9.
