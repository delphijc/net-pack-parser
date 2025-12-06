# Story 7.19: Automated Session Cleanup

**Story ID:** 7.19
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As an admin,
I want the system to automatically delete old files,
So that I don't have to manually SSH in to clear disk space.

## Acceptance Criteria

### AC 1: Retention Policy
- [ ] Configurable retention period (e.g., "7 days").
- [ ] Files older than this are deleted during a nightly cron job or scheduled task.

### AC 2: Cleanup Logic
- [ ] Deletes the `.pcap` file AND the database record.

## Design & Implementation

### Component Structure
- **`CleanupService.ts`**: `node-cron` job running at midnight.

## Dependencies
- Story 7.17.
