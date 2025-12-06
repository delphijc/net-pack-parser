# Story 7.14: Auto-reconnection Logic

**Story ID:** 7.14
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want the app to try and reconnect if the network drops momentarily,
So that I don't lose my session context.

## Acceptance Criteria

### AC 1: Retry Loop
- [ ] Upon disconnection, client attempts to reconnect with exponential backoff (1s, 2s, 4s...).
- [ ] Shows "Reconnecting..." status.

### AC 2: Session Recovery
- [ ] If reconnected, checks if the previous capture session is still active on the server and re-syncs state if possible.

## Design & Implementation

### Component Structure
- **`AgentClient.ts`**: Interceptor for 503/Network Error.

## Dependencies
- Story 7.13.
