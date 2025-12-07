# Story 7.9: RESTful API for Capture Control

**Story ID:** 7.9
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a developer,
I want a structured REST API to interact with the capture agent,
So that the frontend client can perform actions in a standard way.

## Acceptance Criteria

### AC 1: Router Structure
- [x] Express router at `/api`.
- [x] Routes: `/api/capture/...`, `/api/auth/...`, `/api/interfaces/...`.

### AC 2: Error Handling
- [x] Global error handler returns structured JSON.

### AC 3: logging
- [x] Requests logged via morgan.

## Design & Implementation

### Component Structure
- **`server/src/routes/api.ts`**: Main router.
- **`server/src/middleware/errorHandler.ts`**.

## Dependencies
- Story 7.1.
