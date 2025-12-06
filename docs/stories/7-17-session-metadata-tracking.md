# Story 7.17: Session Metadata Tracking

**Story ID:** 7.17
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want the server to remember details about past captures,
So that I can identify them later by date or packet count.

## Acceptance Criteria

### AC 1: Database
- [ ] Server uses a lightweight DB (SQLite via `better-sqlite3` or just a JSON file via `lowdb`) to store session records.

### AC 2: Schema
- [ ] Record includes: `id`, `filename`, `startTime`, `endTime`, `interface`, `packetCount`, `sizeBytes`, `status` (running/finished).

## Design & Implementation

### Component Structure
- **`Database.ts`**: Singleton DB connection.
- **`SessionRepository.ts`**: CRUD operations.

## Dependencies
- Story 7.16.
