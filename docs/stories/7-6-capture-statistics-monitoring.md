# Story 7.6: Capture Statistics Monitoring

**Story ID:** 7.6
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to see real-time statistics of the capture (packets count, dropped packets),
So that I know if the agent is keeping up with the traffic load.

## Acceptance Criteria

### AC 1: Stats API
- [x] `GET /api/capture/stats` returns:
    - `captured`: Packets written.
    - `dropped`: Dropped packets (via `cap.stats()`).
    - `fileSize`: PCAP file size.
    - `duration`: Time since start.

### AC 2: Integration
- [x] Frontend displays metrics in Capture Control panel.

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Maintain counters.
- **`StatsPoller.tsx`**: Client-side component to fetch stats every second.

## Dependencies
- Story 7.3.
