# Story 7.18: Session List & Download API

**Story ID:** 7.18
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to browse and download my previous capture sessions,
So that I can review old evidence.

## Acceptance Criteria

### AC 1: List Endpoint
- [ ] `GET /api/sessions` returns a JSON list of all stored sessions (sorted by date desc).

### AC 2: Download Integration
- [ ] The list includes the download URL (or ID to construct it) for each session.

## Design & Implementation

### Component Structure
- **`SessionController.ts`**: `listSessions()`.

## Dependencies
- Story 7.17.
