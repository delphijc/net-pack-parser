# Tech-Spec: Real-Time Streaming & Live Analysis (Epic 8)

**Created:** 2025-12-06
**Status:** Ready for Development

## Overview

### Problem Statement
Static PCAP analysis is retroactive. To detect and respond to threats as they occur, security analysts need a real-time view of network traffic. This requires streaming captured packets from the server agent to the browser instantly, performing live threat detection, and updating visualizations dynamically without refreshing the page.

### Solution
Implement a WebSocket-based streaming architecture:
1.  **WebSocket Server:** Agent streams packet data (JSON or binary) to connected clients.
2.  **Frontend Consumer:** Browser receives stream, updates UI state (Zustand/Query), and runs detection logic.
3.  **Real-Time Dashboard:** "Live Mode" view with scrolling packet list, updating charts, and instant alerts.

### Scope (In/Out)
**In Scope:**
-   Secure WebSocket (WSS) server setup.
-   WebSocket client implementation (reconnection, error handling).
-   Real-time packet parsing and visualization.
-   Live Threat Detection (running existing detection engines on stream).
-   Live Timeline updates.
-   Stream control (Pause/Resume/Clear).
-   Traffic shaping/filtering on server (send only interesting traffic).

**Out Scope:**
-   Retaining infinite history (browser memory limits - implement ring buffer).
-   Distributed stream aggregation.

## Context for Development

### Codebase Patterns
-   **Server:** `ws` or `socket.io` library.
-   **Client:** `useWebSocket` hook or custom context.
-   **State:** Specialized "LiveStore" in Zustand to avoid re-rendering entire lists (use virtualized lists).

### Files to Reference
-   `docs/epics.md` (FR94-FR100).
-   `server/src/capture/` (Agent from Epic 7).
-   `client/src/components/PacketList.tsx`.

### Technical Decisions
-   **Protocol:** Use pure WebSockets with binary protocol (Protobuf or custom binary Struct) for max performance, or JSON for simplicity if bandwidth allows (< 10Mbps). *Decision: Start with JSON for MVP, optimize to binary if latency > 100ms.*
-   **Throttling:** Implement `lodash.throttle` on UI updates (e.g., update react state 10 times/sec max) to prevent UI freezing during packet storms.

## Implementation Plan

### Tasks

-   [ ] **Task 1: WebSocket Infrastructure**
    -   Setup WSS on Server Agent (Epic 7 extension).
    -   Implement client `WebSocketService`.
-   [ ] **Task 2: Stream Producer**
    -   Connect `PacketCapture` events to WebSocket broadcaster.
    -   Implement generic "subscribe" message with filter options.
-   [ ] **Task 3: Live UI Updates**
    -   Modify `PacketList` to support "Live Mode" (auto-scroll).
    -   Update Dashboard charts in real-time.
-   [ ] **Task 4: Live Threat Detection**
    -   Run `ThreatDetectionEngine` (Epic 3) on incoming packet stream.
    -   Trigger "Toast" notifications for high-severity threats.

### Acceptance Criteria

-   [ ] **AC 1:** Browser connects to Agent via secure WebSocket.
-   [ ] **AC 2:** Packets captured on server appear in browser list within < 200ms.
-   [ ] **AC 3:** Users can "Pause" the live view to inspect a packet while capture continues in background.
-   [ ] **AC 4:** Live Dashboard charts update dynamically as traffic flows.
-   [ ] **AC 5:** Detected threats generate immediate visual alerts.
-   [ ] **AC 6:** Connection loss triggers auto-reconnection attempts with visual indicator.
-   [ ] **AC 7:** Browser memory usage is stable (ring buffer discards old packets after N limit).

## Additional Context

### Dependencies
-   Requires functional Capture Agent (Epic 7).
-   Requires Threat Detection (Epic 3).

### Testing Strategy
-   **Load Testing:** Simulate 1000 packets/sec generation on server, verify browser FPS.
-   **Network Conditioning:** Test behavior with high latency/packet loss (using DevTools).
