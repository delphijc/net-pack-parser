# Story 8.9: Stream Latency & Packet Loss Monitoring

**Story ID:** 8.9
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Ready for Development

## User Story

As a developer,
I want to monitor the "lag" between packet capture time and display time,
So that I can optimize the pipeline.

## Acceptance Criteria

### AC 1: Latency Metrics
- [ ] UI displays "Stream Latency: X ms".
- [ ] Calculated as `Date.now() - packet.timestamp` (assuming synchronized clocks ideally, or just relative drift).

### AC 2: Loss Detection
- [ ] If sequence numbers (optional) skip, UI indicates "Packet Loss Detected".

## Design & Implementation

### Component Structure
- **`PerformanceMonitor.ts`**: Helper class.

## Dependencies
- Story 8.4.
