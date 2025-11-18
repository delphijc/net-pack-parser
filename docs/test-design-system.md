# System-Level Test Design

## Testability Assessment

- Controllability: PASS - Architecture supports API seeding, factories, and mocking of external dependencies (Wasm interfaces, external services). Error conditions can be triggered via mocking.
- Observability: PASS - `tracing` for structured logging is explicitly adopted. NFR validation examples demonstrate checking for telemetry and error reporting. Deterministic tests are a core principle.
- Reliability: PASS - Strong emphasis on isolated, parallel-safe, and stateless tests with proper cleanup. Reproducibility is supported by deterministic testing. Modular design promotes loose coupling.

## Architecturally Significant Requirements (ASRs)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- |
| ASR-001 | PERF     | Capture throughput of at least 1 Gbps | 2           | 3      | 6     | Optimize Rust packet processing, BPF filtering, binary serialization. |
| ASR-002 | PERF     | Latency from capture to alert ≤ 5 seconds | 2           | 3      | 6     | Optimize real-time data flow (WebSockets, buffering), efficient analysis algorithms. |
| ASR-003 | SEC      | Tool runs with least privilege | 2           | 3      | 6     | Careful OS-level permission management, secure coding practices. |
| ASR-004 | SEC      | Input validation to prevent injection or privilege escalation | 3           | 3      | 9     | Comprehensive input validation on all API/CLI interfaces, Rust's type safety. |
| ASR-005 | PERF/TECH| Support up to 10 concurrent capture sessions | 2           | 2      | 4     | Efficient Rust concurrency management, resource pooling. |
| ASR-006 | TECH/SEC | Wasm Plugin Architecture (Secure sandboxing, performance) | 2           | 2      | 4     | Rigorous Wasm module validation, clear host-plugin interface, performance benchmarking. |
| ASR-007 | TECH/BUS | AI-driven Automated Packet Filter Creation (Reliability of AI output, dynamic application) | 3           | 3      | 9     | Robust AI output validation, rule optimization, graceful error handling for AI failures. |

## Test Levels Strategy

- Unit: 60% - Extensive coverage for Rust backend business logic, algorithms, data transformations, Wasm plugin interfaces. React pure components and utility functions.
- Integration: 30% - Backend API contract testing (REST, WebSockets), database interactions (`rusqlite`), Wasm plugin host-plugin communication, external service integrations (mocked/stubbed).
- E2E: 10% - Critical web dashboard user journeys (login, capture, filter, threat analysis, alerting), core CLI workflows, NFR validation (security, reliability).

## NFR Testing Approach

- Security: Playwright E2E tests for authentication/authorization, input validation (XSS, SQL injection). Dedicated security tools (e.g., OWASP ZAP) for deeper scans.
- Performance: k6 for load, stress, spike, and endurance testing to validate 1 Gbps throughput and ≤5s latency. Playwright for perceived performance (Core Web Vitals).
- Reliability: Playwright E2E and API tests for error handling, retry mechanisms, circuit breakers, health checks, and graceful degradation.
- Maintainability: CI/CD pipeline checks for code coverage (≥80%), code duplication (<5%), and vulnerability scanning (npm audit). Playwright tests for observability validation (structured logging, telemetry).

## Test Environment Requirements

- **Local Development:** Standard developer setups for unit/component/some integration tests.
- **CI/CD Pipeline:** Automated ephemeral environments for all test levels, ensuring consistent and isolated execution.
- **Staging/Production-like:** Dedicated environments for comprehensive E2E, performance, and security NFR testing.

## Testability Concerns (if any)

None identified. The architecture demonstrates a strong consideration for testability, with explicit choices (Rust, Wasm, `tracing`) and patterns (modular design, API-first data setup) that support robust testing.

## Recommendations for Sprint 0

1.  **Implement Core Test Framework:** Establish Playwright for E2E/component testing (React), `cargo test` for Rust unit/integration, and k6 for performance.
2.  **Integrate CI/CD:** Set up GitHub Actions (or similar) to run all test levels and NFR checks automatically on every push/PR.
3.  **Develop Data Factories/Fixtures:** Prioritize creating robust data seeding and cleanup mechanisms for both backend and frontend tests to ensure isolation and determinism.
4.  **Define NFR Thresholds:** Formalize specific, measurable thresholds for all critical NFRs (e.g., exact p95 latency, specific error rates) to enable automated gate checks.
5.  **Initial Security Scans:** Integrate basic static analysis and dependency vulnerability scanning into the CI pipeline early.

---

## Test Design Complete

**Scope**: System-Level Testability Review

**Risk Assessment**:

- Total ASRs identified: 7
- High-priority ASRs (≥6): 4 (ASR-001, ASR-002, ASR-003, ASR-004, ASR-007)
- Critical ASRs (9): 2 (ASR-004, ASR-007)
- Categories: PERF, SEC, TECH, BUS

**Coverage Plan**:

- Unit: 60% (Rust logic, React components, utilities)
- Integration: 30% (Backend API, DB, Wasm, external services)
- E2E: 10% (Critical user journeys, CLI workflows, NFR validation)

**Test Levels**:

- E2E: Playwright (Web UI, CLI, NFRs)
- API: Rust `cargo test` (Actix Web, DB, Wasm)
- Performance: k6
- Security: Playwright, OWASP ZAP (external)
- Maintainability: CI tools (coverage, duplication, vulnerabilities)

**Quality Gate Criteria**:

- All Critical ASRs (Score 9) must have clear mitigation plans and owners.
- All High-priority ASRs (Score ≥6) must have defined mitigation strategies.
- NFRs (Performance, Security, Reliability, Maintainability) must meet defined thresholds as validated by automated tests (k6, Playwright, CI checks).
- Test coverage targets (e.g., 80% for critical paths) must be met.

**Output File**: /Users/delphijc/Projects/net-pack-parser/docs/test-design-system.md

**Next Steps**:

1.  Review System-Level Test Design with Architecture and Product teams.
2.  Prioritize mitigation for Critical and High-priority ASRs.
3.  Integrate recommended test frameworks and CI/CD pipelines (Sprint 0 activities).
4.  Define specific NFR thresholds for automated validation.
5.  Proceed with detailed Epic-Level test planning once Solutioning is complete.
