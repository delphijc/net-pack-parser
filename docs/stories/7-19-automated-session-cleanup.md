# Story 7.19: Automated Session Cleanup

**Story ID:** 7.19
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As an admin,
I want the system to automatically delete old files,
So that I don't have to manually SSH in to clear disk space.

## Acceptance Criteria

### AC 1: Retention Policy
- [x] Configurable retention period.
- [x] Files deleted on schedule.

### AC 2: Cleanup Logic
- [x] Deletes file AND database record.

## Design & Implementation

### Component Structure
- **`CleanupService.ts`**: `node-cron` job running at midnight.

## Dependencies
- Story 7.17.
