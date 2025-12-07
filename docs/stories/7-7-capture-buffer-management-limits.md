# Story 7.7: Capture Buffer Management (Limits)

**Story ID:** 7.7
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As an admin,
I want to set a size limit for the capture file,
So that the server disk doesn't fill up completely.

## Acceptance Criteria

### AC 1: Size Limit
- [x] `POST /api/capture/start` accepts `sizeLimit` (MB).
- [x] Capture stops when limit reached.

### AC 2: Safety Stop
- [x] Auto-stops if disk space critical (<100MB).

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Check `fileBytesWritten` against limit.

## Dependencies
- Story 7.3.
