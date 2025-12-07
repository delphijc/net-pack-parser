# Story 8.6: Real-time Alert Generation (Notifications)

**Story ID:** 8.6
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a user,
I want to be notified of high-severity threats even if I'm looking at a different tab (in the app),
So that I don't miss critical events.

## Acceptance Criteria

### AC 1: Toast Alerts
- [x] High Severity threats trigger a Toast notification (top-right via `AlertManager`).
- [ ] Toast is clickable -> jumps to packet. (Deferred)

### AC 2: Audio Alert (Optional)
- [x] Placeholder for sound on Critical threats (structure in `AlertManager.playSound`).

### AC 3: Throttling
- [x] Alerts grouped by threat type within 5-second window, count updated dynamically.

## Design & Implementation

### Component Structure
- **`AlertSystem.tsx`**: Manages Toasts.

## Dependencies
- Story 8.5.
