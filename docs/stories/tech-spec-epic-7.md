# Tech-Spec: Server-Side Capture Agent (Epic 7)

**Created:** 2025-12-06
**Status:** Ready for Development

## Overview

### Problem Statement
Browser-only analysis is limited to static files. Real-world security monitoring requires processing live network traffic directly from network interfaces. This requires a privileged server-side component to capture packets at the kernel level and manage these capture sessions securely.

### Solution
Develop a Node.js-based "Capture Agent" that:
1.  **Interfaces with OS:** Uses `libpcap` to capture packets from network interfaces.
2.  **Manages Authentication:** Secures access via JWT authentication.
3.  **Controls Sessions:** Allows users to start, stop, pause, and configure packet captures remotely.
4.  **Buffers & Streams:** Efficiently buffers captured data for retrieval or streaming.

### Scope (In/Out)
**In Scope:**
-   Node.js server setup with `cap` or `pcap` native bindings.
-   Network interface enumeration.
-   Remote valid credential management (JWT).
-   Start/Stop/Pause/Resume capture controls.
-   BPF filter application at ingest.
-   Session management (saving/deleting capture files).
-   Multi-client support.

**Out Scope:**
-   Real-time WebSocket streaming of *packets* (Deferred to Epic 8).
-   Distributed agent orchestration (Cluster management).

## Context for Development

### Codebase Patterns
-   **Backend:** Node.js + Express + TypeScript.
-   **Native Modules:** Use `cap` or `node-pcap` for capture.
-   **Auth:** `jsonwebtoken` + `bcrypt` for local user db (or config-based auth for MVP).
-   **API:** RESTful API for control plane.

### Files to Reference
-   `server/` directory (Established in Epic 1, but will be significantly expanded).
-   `docs/architecture.md` (Server-Agent Communication protocol).

### Technical Decisions
-   **Privileges:** The agent must run as root/admin to capture packets. Documentation must reflect this.
-   **Storage:** Captures should be written to extensive disk buffers (pcap files) and metadata stored in a lightweight DB (SQLite or simple JSON file db for MVP).
-   **Safety:** Ensure BPF filters are validated to prevent DoS.

## Implementation Plan

### Tasks

-   [ ] **Task 1: Capture Engine Core**
    -   Integrate `cap` library.
    -   Implement `PacketCapture` class to manage `pcap_open_live`, `pcap_loop`, etc.
    -   Implement interface enumeration (`pcap_findalldevs`).
-   [ ] **Task 2: Authentication System**
    -   Implement `AuthController` (Login, Token Refresh).
    -   Protect all API routes with `authMiddleware`.
-   [ ] **Task 3: Capture Control API**
    -   `POST /api/capture/start`: Start capture on interface.
    -   `POST /api/capture/stop`: Stop active session.
    -   `GET /api/interfaces`: List available devices.
-   [ ] **Task 4: Session Management**
    -   Store capture metadata (start time, packet count, file path) in DB.
    -   `GET /api/sessions`: List past captures.
    -   `GET /api/sessions/:id/download`: Stream .pcap file to client.

### Acceptance Criteria

-   [ ] **AC 1:** Agent starts successfully and lists all available network interfaces (eth0, wlan0, etc.).
-   [ ] **AC 2:** Users can authenticate and receive a valid JWT.
-   [ ] **AC 3:** Authenticated user can start a capture on a specific interface with a BPF filter.
-   [ ] **AC 4:** Agent writes captured packets to a temporary PCAP file on the server.
-   [ ] **AC 5:** User can stop the capture and download the resulting PCAP file.
-   [ ] **AC 6:** Capture statistics (packets captured, suppressed) are available via API.
-   [ ] **AC 7:** Multiple users can be connected (auth check), but only one active capture per interface is enforced (or managed carefully).

## Additional Context

### Dependencies
-   Requires `libpcap-dev` (Linux) or Npcap (Windows) installed on the host.

### Testing Strategy
-   **Integration Tests:** Spin up agent (mocked pcap), test Auth/Start/Stop flows.
-   **Manual Verification:** Run agent on local machine, capture loopback traffic, verify PCAP file integrity.

### Notes
-   Security is paramount. The agent runs as root. Ensure input validation is strict.
