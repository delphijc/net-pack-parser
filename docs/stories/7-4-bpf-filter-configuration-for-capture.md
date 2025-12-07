# Story 7.4: BPF Filter Configuration for Capture

**Story ID:** 7.4
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to specify a BPF filter (e.g., "tcp port 80") when starting a capture,
So that I only record relevant traffic and save disk space.

## Acceptance Criteria

### AC 1: API Support
- [x] `POST /api/capture/start` accepts optional `filter` parameter.

### AC 2: Validation
- [x] Filter compiled/validated.
- [x] Returns 400 if syntax invalid.

### AC 3: Application
- [x] Filter enforced via `cap.setFilter()` at kernel level.

## Design & Implementation

### Component Structure
- Update **`CaptureSession.ts`** to pass filter string to `cap.open` or `cap.setMinBytes`.

## Dependencies
- Story 7.3.
