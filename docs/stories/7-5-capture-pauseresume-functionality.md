# Story 7.5: Capture Pause/Resume Functionality

**Story ID:** 7.5
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to pause the capture temporarily without stopping the session,
So that I can ignore irrelevant traffic periods or inspect the current buffer.

## Acceptance Criteria

### AC 1: Pause
- [ ] `POST /api/capture/pause` stops writing new packets to the disk buffer.
- [ ] The underlying interface listener might remain active or be paused depending on implementation, but no new data is added to the session file.

### AC 2: Resume
- [ ] `POST /api/capture/resume` continues writing packets to the same session file.
- [ ] Handles the time gap gracefully in the PCAP (timestamps will just jump).

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Toggle `isPaused` state. In the `libcap` callback, `if (isPaused) return;`.

## Dependencies
- Story 7.3.
