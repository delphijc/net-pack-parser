# Story 8.3: Streaming Protocol Definition (JSON/Binary)

**Story ID:** 8.3
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Ready for Development

## User Story

As a developer,
I need a defined protocol for the WebSocket messages,
So that the server and client agree on data formats.

## Acceptance Criteria

### AC 1: Message Types
- [ ] `SUBSCRIBE { filters... }`: Client -> Server. Start sending data.
- [ ] `PACKET { data... }`: Server -> Client. A new packet arrived.
- [ ] `STATS { captured, dropped }`: Server -> Client. Periodic update.
- [ ] `ERROR { code, msg }`: Server -> Client.

### AC 2: Format
- [ ] JSON format is used for MVP.
- [ ] Timestamps are ISO strings or Unix integers.

## Design & Implementation

### Component Structure
- **`shared/types/WebSocketMessages.ts`**: Shared type definitions (Monorepo benefit).

## Dependencies
- Story 8.1.
