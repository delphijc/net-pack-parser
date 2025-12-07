# Story 8.4: Live Packet Display in Browser

**Story ID:** 8.4
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a user,
I want to see packets appearing in the list as they are captured,
So that I have immediate visibility into the network traffic.

## Acceptance Criteria

### AC 1: Auto-Scroll
- [x] `LivePacketList.tsx` auto-scrolls to bottom.
- [x] Toggle for auto-scroll.

### AC 2: Buffer Limit
- [x] `liveStore` maintains 10k packet buffer.
- [x] Oldest packets dropped when limit reached.

### AC 3: Pause
- [x] Pause button stops UI updates (`isPaused` in `liveStore`).

## Design & Implementation

### Component Structure
- **`PacketList.tsx`**: Update to handle streaming `packets` prop from store.
- **`useLiveStore`** (Zustand): Specialized store for high-frequency updates.

## Dependencies
- Story 8.2.
