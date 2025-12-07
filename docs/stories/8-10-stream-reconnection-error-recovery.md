# Story 8.10: Stream Reconnection & Error Recovery

**Story ID:** 8.10
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a user,
I want the application to automatically recover from network interruptions,
So that I don't have to manually refresh the page when the connection drops.

## Acceptance Criteria

### AC 1: Detection
- [x] Client detects WebSocket closure (code != 1000) in `useWebSocket.ts`.
- [x] UI displays `ConnectionBanner` with reconnecting/failed states.

### AC 2: Recovery Strategy
- [x] Exponential backoff implemented (1s to 30s max).
- [x] Max 5 retries, then "Connection Lost" with "Retry" button.

### AC 3: State Sync
- [x] Upon reconnection, `liveStore` buffer is cleared in `LivePacketList` to avoid stale data.

## Design & Implementation

### Component Structure
- **`useWebSocket.ts`**: Reconnection logic.
- **`ConnectionBanner.tsx`**: UI feedback.

## Dependencies
- Story 8.2.
