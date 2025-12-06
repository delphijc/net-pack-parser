# Story 8.8: Stream Filtering & Traffic Shaping

**Story ID:** 8.8
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Ready for Development

## User Story

As a user,
I want to filter the stream at the source (server),
So that I don't waste bandwidth receiving packets I don't care about.

## Acceptance Criteria

### AC 1: Dynamic Filter
- [ ] Client can send a `UPDATE_FILTER` message over WebSocket.
- [ ] Server applies this filter to the stream immediately.

### AC 2: Traffic Shaping (Throttle)
- [ ] Client can request a "throttle" (e.g., max 100 packets/sec).
- [ ] Server samples or drops excess packets to respect the limit (optional enhancement, nice to have for performance).

## Design & Implementation

### Component Structure
- **`WebSocketHandler.ts`**: Handle filter message.

## Dependencies
- Story 8.3.
