# Story 7.8: PCAP File Export from Live Capture

**Story ID:** 7.8
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to download the PCAP file created by the server agent,
So that I can analyze it locally in the browser or other tools.

## Acceptance Criteria

### AC 1: Download Endpoint
- [x] `GET /api/sessions/:id/download` streams file.
- [x] Content-Disposition header set.

### AC 2: Access Control
- [x] Auth required (via JWT middleware).

## Design & Implementation

### Component Structure
- **`SessionController.ts`**: Handle download request.
- **`fs.createReadStream`**: Pipe to response.

## Dependencies
- Story 7.3.
