# Story 7.13: Connection Status Monitoring

**Story ID:** 7.13
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to know if I am currently connected to the agent and what the latency is,
So that I can trust the data I'm seeing is current.

## Acceptance Criteria

### AC 1: Status Indicator
- [ ] UI Header displays a status icon (Green/Red/Amber).
- [ ] Tooltip shows latency (ping time).

### AC 2: Heartbeat
- [ ] Client polls `/api/health` or similar every N seconds.
- [ ] Status updates to "Disconnected" if N polls fail.

## Design & Implementation

### Component Structure
- **`ConnectionStatus.tsx`**: Badge component.
- **`AgentClient.ts`**: Polling logic.

## Dependencies
- Story 7.12.
