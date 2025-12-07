# Story 8.9: Stream Latency & Packet Loss Monitoring

**Story ID:** 8.9
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As a developer,
I want to monitor the "lag" between packet capture time and display time,
So that I can optimize the pipeline.

## Acceptance Criteria

### AC 1: Latency Metrics
- [x] UI displays "Latency: X ms" in `LivePacketList` toolbar.
- [x] Calculated using exponential moving average in `liveStore`.

### AC 2: Loss Detection
- [ ] Packet loss detection - Deferred (requires sequence numbers not in current `PacketData`).

## Design & Implementation

### Component Structure
- **`PerformanceMonitor.ts`**: Helper class.

## Dependencies
- Story 8.4.
