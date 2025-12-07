# Story 7.17: Session Metadata Tracking

**Story ID:** 7.17
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want the server to remember details about past captures,
So that I can identify them later by date or packet count.

## Acceptance Criteria

### AC 1: Database
- [x] Server uses JSON file or SQLite for sessions.

### AC 2: Schema
- [x] Record: `id`, `filename`, `startTime`, `endTime`, `interface`, `packetCount`, `sizeBytes`, `status`.

## Design & Implementation

### Component Structure
- **`Database.ts`**: Singleton DB connection.
- **`SessionRepository.ts`**: CRUD operations.

## Dependencies
- Story 7.16.
