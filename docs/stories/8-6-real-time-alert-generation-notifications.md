# Story 8.6: Real-time Alert Generation (Notifications)

**Story ID:** 8.6
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Ready for Development

## User Story

As a user,
I want to be notified of high-severity threats even if I'm looking at a different tab (in the app),
So that I don't miss critical events.

## Acceptance Criteria

### AC 1: Toast Alerts
- [ ] High Severity threats trigger a Toast notification (top-right).
- [ ] Toast is clickable -> jumps to packet.

### AC 2: Audio Alert (Optional)
- [ ] Option to play a sound on Critical threats.

### AC 3: Throttling
- [ ] Prevent "alert fatigue" by grouping similar alerts (e.g., "5 SQL Injection attempts detected").

## Design & Implementation

### Component Structure
- **`AlertSystem.tsx`**: Manages Toasts.

## Dependencies
- Story 8.5.
