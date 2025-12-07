# Story 7.2: Network Interface Enumeration

**Story ID:** 7.2
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to see a list of available network interfaces (e.g., eth0, wlan0) on the server,
So that I can choose which one to capture traffic from.

## Acceptance Criteria

### AC 1: API Endpoint
- [x] `GET /api/interfaces` returns JSON list (via `CaptureService.getInterfaces()`).
- [x] Each device includes: `name`, `addresses`, `description`.

### AC 2: Filtering
- [x] Loopback interface identified.
- [x] Inactive interfaces flagged.

## Design & Implementation

### Component Structure
- **`CaptureService.ts`**: Method `getInterfaces()`.
- **`InterfaceController.ts`**: API Handler.

## Dependencies
- Story 7.1.
