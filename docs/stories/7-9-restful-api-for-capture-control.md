# Story 7.9: RESTful API for Capture Control

**Story ID:** 7.9
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a developer,
I want a structured REST API to interact with the capture agent,
So that the frontend client can perform actions in a standard way.

## Acceptance Criteria

### AC 1: Router Structure
- [ ] Express router set up at `/api`.
- [ ] Grouped routes: `/api/capture/...`, `/api/auth/...`, `/api/interfaces/...`.

### AC 2: Error Handling
- [ ] Global error handler middleware returns structured JSON errors (`{ error: string, code: number }`).

### AC 3: logging
- [ ] API requests are logged to console/file (morgan/winston).

## Design & Implementation

### Component Structure
- **`server/src/routes/api.ts`**: Main router.
- **`server/src/middleware/errorHandler.ts`**.

## Dependencies
- Story 7.1.
