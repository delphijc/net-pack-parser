# Story 7.3: Packet Capture Start/Stop Control

**Story ID:** 7.3
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to start and stop packet capture sessions via the API,
So that I can control the agent remotely.

## Acceptance Criteria

### AC 1: Start Capture
- [ ] `POST /api/capture/start` accepts `{ interface: string, promiscuous: boolean }`.
- [ ] Starts a background capture process.
- [ ] Writes raw packets to a temporary `.pcap` file on disk.

### AC 2: Stop Capture
- [ ] `POST /api/capture/stop` terminates the active capture.
- [ ] Closes the file handle properly.

### AC 3: Status
- [ ] API returns 409 Conflict if capture is already running on that interface.

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Class managing the `Cap` instance and file stream.

## Dependencies
- Story 7.1.
