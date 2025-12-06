# Story 7.15: Version Compatibility Check

**Story ID:** 7.15
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want the client to warn me if the connected agent is incompatible,
So that I don't face weird bugs due to version mismatch.

## Acceptance Criteria

### AC 1: Version Handshake
- [ ] Client requests `GET /api/version` on connect.
- [ ] Client compares Server Version vs Client Version (semver).

### AC 2: Enforcement
- [ ] If Major version differs, block connection and show error.
- [ ] If Minor version differs, show warning.

## Design & Implementation

### Component Structure
- **`AgentClient.ts`**: Check logic.
- **`VersionWarning.tsx`**: Modal.

## Dependencies
- Story 7.12.
