# Story 7.16: Capture Session Storage Management

**Story ID:** 7.16
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a system,
I need a robust way to store capture files on the disk,
So that they don't overwrite each other and are easy to locate.

## Acceptance Criteria

### AC 1: Directory Structure
- [ ] Server ensures a `captures/` directory exists.
- [ ] Files are named with UUIDs or timestamps: `capture-<timestamp>-<interface>.pcap`.

### AC 2: Write Stream
- [ ] Capture engine writes directly to this file stream.

## Design & Implementation

### Component Structure
- **`StorageService.ts`**: Helper to generate paths and ensure directories.

## Dependencies
- Story 7.1.
