# Story 8.10: Stream Reconnection & Error Recovery

**Story ID:** 8.10
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Ready for Development

## User Story

As a user,
I want the application to automatically recover from network interruptions,
So that I don't have to manually refresh the page when the connection drops.

## Acceptance Criteria

### AC 1: Detection
- [ ] Client detects WebSocket closure (code != 1000) or heartbeat timeout.
- [ ] UI displays a "Reconnecting..." banner or toaster.

### AC 2: Recovery Strategy
- [ ] Exponential backoff strategy for reconnection attempts (1s, 2s, 5s, 10s).
- [ ] Max retries limit (e.g., 5 attempts), then show "Connection Lost" modal with manual "Retry" button.

### AC 3: State Sync
- [ ] Upon reconnection, client requests the *latest* state or clears the buffer to avoid showing stale data mixed with new data.

## Design & Implementation

### Component Structure
- **`useWebSocket.ts`**: Reconnection logic.
- **`ConnectionBanner.tsx`**: UI feedback.

## Dependencies
- Story 8.2.
