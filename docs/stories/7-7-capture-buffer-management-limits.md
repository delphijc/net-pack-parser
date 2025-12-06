# Story 7.7: Capture Buffer Management (Limits)

**Story ID:** 7.7
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As an admin,
I want to set a size limit for the capture file,
So that the server disk doesn't fill up completely.

## Acceptance Criteria

### AC 1: Size Limit
- [ ] `POST /api/capture/start` accepts `{ sizeLimit: number }` (in MB).
- [ ] When the PCAP file reaches this limit, the capture automatically stops (or rotates - for now, Stop is safer for MVP).

### AC 2: Safety Stop
- [ ] System automatically stops capture if disk space is critical (< 100MB free).

## Design & Implementation

### Component Structure
- **`CaptureSession.ts`**: Check `fileBytesWritten` against limit.

## Dependencies
- Story 7.3.
