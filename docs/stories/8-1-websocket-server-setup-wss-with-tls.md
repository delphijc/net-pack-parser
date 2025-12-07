# Story 8.1: WebSocket Server Setup (WSS with TLS)

**Story ID:** 8.1
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a developer,
I want the server agent to accept secure WebSocket connections,
So that I can push real-time data to the browser.

## Acceptance Criteria

### AC 1: WSS Initialization
- [x] `WebSocketServer` initialized via `ws` library in `WebSocketService.ts`.
- [x] TLS supported via HTTPS server.

### AC 2: Authentication
- [x] JWT validated via query param in upgrade handshake.
- [x] Returns 401/403 for invalid tokens.

## Design & Implementation

### Component Structure
- **`WebSocketHandler.ts`**: Class handling the `upgrade` event and connection pool.

## Dependencies
- Story 7.10 (Auth).
