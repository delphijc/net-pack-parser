# Story 7.15: Version Compatibility Check

**Story ID:** 7.15
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want the client to warn me if the connected agent is incompatible,
So that I don't face weird bugs due to version mismatch.

## Acceptance Criteria

### AC 1: Version Handshake
- [x] Client requests `/api/version` on connect.
- [x] Compares versions.

### AC 2: Enforcement
- [x] Major mismatch blocks connection.
- [x] Minor mismatch shows warning.

## Design & Implementation

### Component Structure
- **`AgentClient.ts`**: Check logic.
- **`VersionWarning.tsx`**: Modal.

## Dependencies
- Story 7.12.
