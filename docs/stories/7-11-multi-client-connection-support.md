# Story 7.11: Multi-client Connection Support

**Story ID:** 7.11
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want the system to handle multiple browser tabs or users gracefully,
So that I don't crash the agent by accident.

## Acceptance Criteria

### AC 1: Interface Locking
- [ ] Only ONE capture session can be active on a specific interface at a time.
- [ ] If User A is capturing on `eth0`, User B sees it as "Busy" or "In Use".

### AC 2: Shared State
- [ ] If User B connects while User A is capturing, User B can see the *status* of the capture (e.g., "Capturing... 500 pkts"), but cannot Start a new one on that interface.

## Design & Implementation

### Component Structure
- **`SessionManager.ts`**: Singleton tracking active sessions per interface.

## Dependencies
- Story 7.3.
