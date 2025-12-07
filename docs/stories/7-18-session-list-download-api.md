# Story 7.18: Session List & Download API

**Story ID:** 7.18
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to browse and download my previous capture sessions,
So that I can review old evidence.

## Acceptance Criteria

### AC 1: List Endpoint
- [x] `GET /api/sessions` returns session list.

### AC 2: Download Integration
- [x] List includes download URL/ID.

## Design & Implementation

### Component Structure
- **`SessionController.ts`**: `listSessions()`.

## Dependencies
- Story 7.17.
