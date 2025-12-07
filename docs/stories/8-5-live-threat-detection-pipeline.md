# Story 8.5: Live Threat Detection Pipeline

**Story ID:** 8.5
**Epic:** 8 (Real-Time Streaming & Live Analysis)
**Status:** Done

## User Story

As an analyst,
I want the threats to be identified immediately as packets arrive,
So that I can respond to attacks in real-time.

## Acceptance Criteria

### AC 1: Stream Processing
- [x] The received packet stream is passed through the `ThreatDetectionEngine` (from Epic 3).
- [x] Detection happens in a Web Worker (`threatWorker.ts`) before adding to the UI list.

### AC 2: Threat Tagging
- [x] Packets identified as threats are marked with `severity` in the live store.

## Design & Implementation

### Component Structure
- **`LiveProcessor.ts`**: Worker or Service that takes raw JSON -> parses -> runs detection -> updates Store.

## Dependencies
- Story 8.4.
- Epic 3 (Detection Engine).
