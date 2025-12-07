# Story 7.14: Auto-reconnection Logic

**Story ID:** 7.14
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want the app to try and reconnect if the network drops momentarily,
So that I don't lose my session context.

## Acceptance Criteria

### AC 1: Retry Loop
- [x] Exponential backoff reconnection in `useWebSocket`.
- [x] Shows "Reconnecting..." status.

### AC 2: Session Recovery
- [x] Re-syncs state on reconnect.

## Design & Implementation

### Component Structure
- **`AgentClient.ts`**: Interceptor for 503/Network Error.

## Dependencies
- Story 7.13.
