# Story 7.11: Multi-client Connection Support

**Story ID:** 7.11
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want the system to handle multiple browser tabs or users gracefully,
So that I don't crash the agent by accident.

## Acceptance Criteria

### AC 1: Interface Locking
- [x] One capture session per interface.
- [x] Shows "Busy" if in use.

### AC 2: Shared State
- [x] Other users can view capture status but cannot start new capture.

## Design & Implementation

### Component Structure
- **`SessionManager.ts`**: Singleton tracking active sessions per interface.

## Dependencies
- Story 7.3.
