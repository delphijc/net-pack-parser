# Story 7.3: Packet Capture Start/Stop Control

**Story ID:** 7.3
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to start and stop packet capture sessions via the API,
So that I can control the agent remotely.

## Acceptance Criteria

### AC 1: Start Capture
- [x] `POST /api/capture/start` accepts `{ interface, promiscuous }` via `CaptureController`.
- [x] Starts background capture via `CaptureSession`.
- [x] Writes to temp `.pcap` file.

### AC 2: Stop Capture
- [x] `POST /api/capture/stop` terminates capture.
- [x] File handle closed properly.

### AC 3: Status
- [x] Returns 409 if capture already running.

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Class managing the `Cap` instance and file stream.

## Dependencies
- Story 7.1.
