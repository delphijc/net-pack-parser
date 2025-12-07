# Story 7.5: Capture Pause/Resume Functionality

**Story ID:** 7.5
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to pause the capture temporarily without stopping the session,
So that I can ignore irrelevant traffic periods or inspect the current buffer.

## Acceptance Criteria

### AC 1: Pause
- [x] `POST /api/capture/pause` - stops writing to buffer.
- [x] `CaptureSession.isPaused` flag controls packet writing.

### AC 2: Resume
- [x] `POST /api/capture/resume` continues writing.
- [x] Timestamps jump handled gracefully.

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Toggle `isPaused` state. In the `libcap` callback, `if (isPaused) return;`.

## Dependencies
- Story 7.3.
