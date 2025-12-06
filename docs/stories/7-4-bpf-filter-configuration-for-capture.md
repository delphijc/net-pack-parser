# Story 7.4: BPF Filter Configuration for Capture

**Story ID:** 7.4
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to specify a BPF filter (e.g., "tcp port 80") when starting a capture,
So that I only record relevant traffic and save disk space.

## Acceptance Criteria

### AC 1: API Support
- [ ] `POST /api/capture/start` accepts optional `{ filter: string }` parameter.

### AC 2: Validation
- [ ] Agent attempts to compile/set the filter.
- [ ] Returns 400 Bad Request if filter syntax is invalid.

### AC 3: Application
- [ ] Capture engine enforces the filter at the kernel/library level (pre-ingest).

## Design & Implementation

### Component Structure
- Update **`CaptureSession.ts`** to pass filter string to `cap.open` or `cap.setMinBytes`.

## Dependencies
- Story 7.3.
