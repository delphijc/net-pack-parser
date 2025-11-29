# System-Level Test Design

## Testability Assessment

- **Controllability**: **PASS** with conditions.
    - *Browser-Only Mode*: High controllability via `localStorage` and file injection.
    - *Connected Mode*: Server state is controllable via API.
    - *Concerns*: Native packet capture (`libpcap`) requires root privileges, making it hard to control in standard CI environments. WebSocket streaming requires specific mocking strategies for deterministic testing.
- **Observability**: **PASS**.
    - Architecture defines structured logging (winston/pino) and standardized error responses.
    - Frontend performance metrics (Core Web Vitals) are built-in.
- **Reliability**: **PASS**.
    - Stateless server design (mostly) aids reliability.
    - Reconnection logic for WebSocket is explicitly defined (FR80).

## Architecturally Significant Requirements (ASRs)

| ASR ID | Requirement | Risk Score | Rationale |
| :--- | :--- | :--- | :--- |
| **ASR-001** | **Real-Time Streaming Latency < 500ms** (NFR-SP1) | **9** (Prob: 3, Imp: 3) | Critical for "live" feel. High technical risk due to network variability and processing overhead. |
| **ASR-002** | **High Throughput Capture (10k pps)** (NFR-SP2) | **6** (Prob: 2, Imp: 3) | High volume can crash the agent or flood the browser. Buffer management is critical. |
| **ASR-003** | **Browser Memory Usage < 500MB** (NFR-P7) | **6** (Prob: 2, Imp: 3) | Processing large PCAPs or long streams in-browser can easily cause OOM crashes. |
| **ASR-004** | **Cross-Platform Native Capture** (Linux/Win/Mac) | **6** (Prob: 3, Imp: 2) | Native bindings (`cap`) behave differently across OSs. High risk of platform-specific bugs. |
| **ASR-005** | **Secure WebSocket (WSS/TLS 1.3)** (NFR-S8) | **4** (Prob: 2, Imp: 2) | Standard security but essential for data privacy. |

## Test Levels Strategy

- **Unit: 60%**
    - **Rationale**: Heavy algorithmic logic in parsing (PCAP, BPF), threat detection (YARA, signatures), and data transformation. These are best tested in isolation with fast feedback.
    - **Focus**: `pcap-decoder`, `bpfFilter`, `threatDetection`, `hashGenerator`, `packetStream` logic.
- **Integration: 10%**
    - **Rationale**: Validate boundaries between Capture Agent and OS (mocked), and between Frontend and WebSocket API.
    - **Focus**: API endpoints, WebSocket handshake, `localStorage` wrapper, `sessionManager`.
- **Component: 20%**
    - **Rationale**: Complex UI visualizations (Charts, Timeline, Packet List) need verification of rendering logic and interaction handling.
    - **Focus**: `PacketList`, `TimelineView`, `Charts`, `FilterBar`.

## NFR Testing Approach

- **Security**:
    - **Static Analysis**: Automated dependency scanning (npm audit), SAST in CI.
    - **Dynamic Analysis**: OWASP ZAP scans against API and WebSocket endpoints.
    - **Auth**: Automated tests for JWT validation, expiration, and refresh flows.
- **Performance**:
    - **Server**: `k6` load tests simulating multiple concurrent WebSocket clients and high packet rates.
    - **Browser**: Manual tests using DevTools to monitor memory usage and FPS during heavy rendering.
- **Reliability**:
    - **Chaos Testing**: Simulate network interruptions (disconnect WebSocket) to verify auto-reconnection (FR80) and buffer handling.
    - **Stress Testing**: Push capture agent to 10k+ pps to verify stability and buffer limits.
- **Maintainability**:
    - **Code Quality**: Strict ESLint/Prettier rules, 80% code coverage gate.
    - **Types**: Strict TypeScript checks (no `any`).

## Test Environment Requirements

- **CI Environment**: Standard Linux runners for Unit/Component/Integration tests.
- **Native Agent Testing**:
    - Requires **Privileged Runners** (Linux with `CAP_NET_RAW`) or specific VM images for Windows/macOS testing.
    - Alternatively, extensive **Mocking** of the `cap` library to simulate OS interactions in standard containers.
- **Performance Lab**: Isolated environment for `k6` benchmarks to ensure consistent results (no noisy neighbors).

## Testability Concerns (if any)

- **Concern 1: Native Libpcap Dependency**: Testing the `cap` library requires root privileges and OS-specific libraries, making CI/CD complex.
    - *Mitigation*: Create a robust `MockCaptureService` that simulates packet streams from a file, allowing logic testing without root. Use a smaller set of "smoke tests" on privileged runners for actual hardware integration.
- **Concern 2: WebSocket Mocking**: accurately simulating WebSocket frames (control vs data) in Vitest can be flaky.
    - *Mitigation*: Use a dedicated WebSocket mock server or a proxy.

## Recommendations for Sprint 0

1.  **Infrastructure**: Initialize Monorepo with Vitest workspace (client + server).
2.  **Mocking Strategy**: Implement `MockCaptureService` interface immediately to decouple logic from `libpcap`.
3.  **Performance Baseline**: Create a "Golden PCAP" (standard size/complexity) to benchmark parsing speed and memory usage early.
4.  **CI Pipeline**: Configure GitHub Actions with separate jobs for "Standard Tests" (Unit/Integration) and "Native Tests" (requiring special runners).
