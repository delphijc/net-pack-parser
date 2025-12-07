# Story 8.3: Streaming Protocol Definition (JSON/Binary)

**Story ID:** 8.3
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a developer,
I need a defined protocol for the WebSocket messages,
So that the server and client agree on data formats.

## Acceptance Criteria

### AC 1: Message Types
- [x] `SUBSCRIBE`, `UPDATE_FILTER`: Client -> Server.
- [x] `PACKET`: Server -> Client (new packet).
- [x] `STATS`: Server -> Client (periodic).
- [x] `ERROR`: Server -> Client.

### AC 2: Format
- [x] JSON format used.
- [x] Timestamps as Unix integers.

## Design & Implementation

### Component Structure
- **`shared/types/WebSocketMessages.ts`**: Shared type definitions (Monorepo benefit).

## Dependencies
- Story 8.1.
