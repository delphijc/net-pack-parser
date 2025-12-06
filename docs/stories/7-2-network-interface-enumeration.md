# Story 7.2: Network Interface Enumeration

**Story ID:** 7.2
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to see a list of available network interfaces (e.g., eth0, wlan0) on the server,
So that I can choose which one to capture traffic from.

## Acceptance Criteria

### AC 1: API Endpoint
- [ ] `GET /api/interfaces` returns a JSON list of devices.
- [ ] Each device object includes: `name`, `addresses` (IP/MAC), `description`.

### AC 2: Filtering
- [ ] Loopback interface is identified.
- [ ] Down/Inactive interfaces are flagged.

## Design & Implementation

### Component Structure
- **`CaptureService.ts`**: Method `getInterfaces()`.
- **`InterfaceController.ts`**: API Handler.

## Dependencies
- Story 7.1.
