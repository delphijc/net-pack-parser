# Story 8.8: Stream Filtering & Traffic Shaping

**Story ID:** 8.8
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a user,
I want to filter the stream at the source (server),
So that I don't waste bandwidth receiving packets I don't care about.

## Acceptance Criteria

### AC 1: Dynamic Filter
- [x] Client can send `UPDATE_FILTER` message via `LiveFilterPanel`.
- [x] Server applies filter per-client in `WebSocketService.broadcast()`.

### AC 2: Traffic Shaping (Throttle)
- [ ] Throttle (max packets/sec) - Deferred as optional enhancement.

## Design & Implementation

### Component Structure
- **`WebSocketHandler.ts`**: Handle filter message.

## Dependencies
- Story 8.3.
