# Story 7.6: Capture Statistics Monitoring

**Story ID:** 7.6
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to see real-time statistics of the capture (packets count, dropped packets),
So that I know if the agent is keeping up with the traffic load.

## Acceptance Criteria

### AC 1: Stats API
- [ ] `GET /api/capture/stats` (or SSE stream) returns:
    - `captured`: Total packets written to disk.
    - `dropped`: Packets dropped by kernel (if available via `cap.stats()`).
    - `fileSize`: Current size of the PCAP file.
    - `duration`: Time since start.

### AC 2: Integration
- [ ] Frontend displays these metrics in the Capture Control panel.

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Maintain counters.
- **`StatsPoller.tsx`**: Client-side component to fetch stats every second.

## Dependencies
- Story 7.3.
