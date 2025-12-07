# Story 7.16: Capture Session Storage Management

**Story ID:** 7.16
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a system,
I need a robust way to store capture files on the disk,
So that they don't overwrite each other and are easy to locate.

## Acceptance Criteria

### AC 1: Directory Structure
- [x] `captures/` directory created.
- [x] UUID/timestamp-based filenames.

### AC 2: Write Stream
- [x] Direct file stream writing.

## Design & Implementation

### Component Structure
- **`StorageService.ts`**: Helper to generate paths and ensure directories.

## Dependencies
- Story 7.1.
