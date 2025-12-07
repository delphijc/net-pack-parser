# Story 7.13: Connection Status Monitoring

**Story ID:** 7.13
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to know if I am currently connected to the agent and what the latency is,
So that I can trust the data I'm seeing is current.

## Acceptance Criteria

### AC 1: Status Indicator
- [x] Status icon in UI (via `ConnectionStatus.tsx`).
- [x] Tooltip shows connection state.

### AC 2: Heartbeat
- [x] Client polls health endpoint.
- [x] Updates status on failure.

## Design & Implementation

### Component Structure
- **`ConnectionStatus.tsx`**: Badge component.
- **`AgentClient.ts`**: Polling logic.

## Dependencies
- Story 7.12.
