# Story 8.4: Live Packet Display in Browser

**Story ID:** 8.4
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Ready for Development

## User Story

As a user,
I want to see packets appearing in the list as they are captured,
So that I have immediate visibility into the network traffic.

## Acceptance Criteria

### AC 1: Auto-Scroll
- [ ] Packet List has a "Live" mode where it automatically scrolls to the bottom as new items arrive.
- [ ] User can toggle "Auto-Scroll" on/off.

### AC 2: Buffer Limit
- [ ] Frontend maintains a circular buffer (e.g., max 10,000 packets) to prevent memory crashes.
- [ ] Old packets are dropped from the state when limit is reached.

### AC 3: Pause
- [ ] "Pause" button stops the UI updates (but continues buffering in background or drops if buffer full).

## Design & Implementation

### Component Structure
- **`PacketList.tsx`**: Update to handle streaming `packets` prop from store.
- **`useLiveStore`** (Zustand): Specialized store for high-frequency updates.

## Dependencies
- Story 8.2.
