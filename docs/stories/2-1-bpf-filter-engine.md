# Story 2.1: BPF Filter Engine

Status: done

## Story

As a security analyst,
I want to apply Berkeley Packet Filter (BPF) syntax to filter packets,
so that I can use industry-standard filtering expressions I already know.

## Acceptance Criteria

1.  **Given** packets are loaded in the application
2.  **When** I enter a BPF filter expression in the filter input (e.g., "tcp port 443")
3.  **Then** the system validates the BPF syntax
4.  **And if valid**, applies the filter and shows only matching packets
5.  **And** displays filter status: "Showing X of Y packets (filtered by: tcp port 443)"
6.  **And if invalid syntax**, shows error inline: "Invalid BPF syntax near 'port'"
7.  **And** common BPF filters work correctly:
    *   `tcp port 443` - TCP traffic on port 443
    *   `host 192.168.1.1` - Traffic to/from specific IP
    *   `src net 10.0.0.0/8` - Source from 10.x.x.x network
    *   `tcp and not port 22` - TCP except SSH
8.  **And** I can clear the filter with one click

## Tasks / Subtasks

#### Overall Goal: Implement a client-side Berkeley Packet Filter (BPF) engine for real-time packet filtering within the application.

#### Estimated Time: 6 days

## 1. BPF Parser & Validator Implementation (2.5 days)

*   [x] **1.1. Research BPF Parser Libraries (0.5 days)**
    *   **Task**: Investigate existing JavaScript BPF parser libraries (e.g., `bpf.js`, `pcap-parser`'s internal BPF logic) or specifications for implementing a custom one. (Ref: `epics.md` Technical Notes, `architecture.md` BPF Filtering)
    *   **Subtask**: Evaluate pros/cons of using an existing library vs. custom implementation based on project conventions (lightweight, modularity, TypeScript compatibility).
*   [x] **1.2. Create `client/src/utils/bpfFilter.ts` (1.0 day)**
    *   **Task**: Implement the core BPF parsing and validation logic.
    *   **Subtask**: Support common BPF primitives: `host`, `net`, `port`, `tcp`, `udp`, `icmp`, `src`, `dst`.
    *   **Subtask**: Support boolean operators: `and`, `or`, `not`.
    *   **Subtask**: Implement syntax validation that returns clear error messages for invalid expressions (AC 3, AC 6).
*   [x] **1.3. Implement BPF Matching Logic (1.0 day)**
    *   **Task**: Develop a function within `bpfFilter.ts` that takes a parsed BPF expression and a `Packet` object, returning `true` if the packet matches the filter, `false` otherwise. (AC 4, AC 7)
    *   **Subtask**: Ensure correct matching for various filter types (IP addresses, port ranges, protocols).
    *   **Subtask**: Integrate with `Packet` interface for efficient access to packet metadata.

## 2. UI Component Development & Integration (2.0 days)

*   [x] **2.1. Create `client/src/components/FilterBar.tsx` (1.0 day)**
    *   **Task**: Develop a new React component for the BPF filter input field and status display. (AC 2)
    *   **Subtask**: Include an input field for BPF expressions.
    *   **Subtask**: Display filter status (e.g., "Showing X of Y packets") (AC 5).
    *   **Subtask**: Display inline error messages for invalid BPF syntax (AC 6).
    *   **Subtask**: Implement a "Clear Filter" button (AC 8).
    *   **Subtask**: Use `shadcn/ui` components for styling (Input, Button, Alert for errors).
*   [x] **2.2. Integrate `FilterBar.tsx` into `PcapAnalysisPage.tsx` (0.5 days)**
    *   **Task**: Place the `FilterBar` component prominently on the PCAP Analysis page.
    *   **Subtask**: Establish state management for the BPF expression and filter results (e.g., using Zustand).
*   [x] **2.3. Filter Packet List Display (0.5 days)**
    *   **Task**: Modify `client/src/components/PacketList.tsx` to receive a filtered list of packets and display them. (AC 4)
    *   **Subtask**: Update the displayed packet count to reflect the filtered results (AC 5).

## 3. Integration with Packet Data (0.5 days)

*   [x] **3.1. Apply Filter to Loaded Packets (0.5 days)**
    *   **Task**: In the `PcapAnalysisPage.tsx` or a dedicated service, apply the `bpfFilter.ts` matching logic to the currently loaded packets whenever the BPF expression changes. (AC 1, AC 4)
    *   **Subtask**: Ensure filtering is performed in-memory efficiently. (Ref: `epics.md` Technical Notes)
    *   **Subtask**: Manage the state of filtered packets and pass them down to `PacketList.tsx`.

## 4. Testing (1.0 day)

*   [x] **4.1. Unit Tests for `bpfFilter.ts` (0.5 days)**
    *   **Task**: Write comprehensive unit tests for BPF parsing, validation, and matching logic. (Ref: `architecture.md` Testing)
    *   **Subtask**: Test valid BPF expressions (`tcp port 80`, `host 1.2.3.4`, `src net 10.0.0.0/8 and not port 22`).
    *   **Subtask**: Test invalid BPF expressions (syntax errors, unknown primitives).
    *   **Subtask**: Test edge cases (empty filter, very long filter).
*   [x] **4.2. Component Tests for `FilterBar.tsx` (0.25 days)**
    *   **Task**: Write component tests using React Testing Library. (Ref: `architecture.md` Testing)
    *   **Subtask**: Verify input changes, error message display, and "Clear Filter" button functionality.
    *   **Subtask**: Simulate valid and invalid filter submissions.


## Dev Notes

### Relevant architecture patterns and constraints

*   **BPF Filtering**: Custom implementation (JavaScript BPF parser) will be used. (Ref: [Source: docs/architecture.md#Decision Summary])
*   **Component Placement**: The core BPF parsing logic will reside in `client/src/utils/bpfFilter.ts`, and the UI for filter input and display will be in `client/src/components/FilterBar.tsx`. Search logic will integrate with `PacketList.tsx`. (Ref: [Source: docs/architecture.md#Epic to Architecture Mapping])
*   **Technology Stack**: The frontend will continue to use React, TypeScript, Vite, Tailwind CSS, and shadcn/ui. (Ref: [Source: docs/architecture.md#Decision Summary])
*   **Performance**: Filtering operations should be applied in-memory and syntax validated pre-emptively to maintain responsiveness. (Ref: [Source: docs/epics.md#Story 2.1 Technical Notes])
*   **Testing**: Adherence to the established testing stack: Vitest for unit tests, React Testing Library for component tests, and Playwright for E2E tests. (Ref: [Source: docs/architecture.md#Testing Framework])

### Source tree components to touch

*   **New**: `client/src/utils/bpfFilter.ts`, `client/src/components/FilterBar.tsx`.
*   **Modified**: `client/src/components/PacketList.tsx`, `client/src/pages/PcapAnalysisPage.tsx` (or similar top-level analysis page), potentially `client/src/types/packet.ts` for filter state.

### Testing standards summary

*   **Unit Tests**: `Vitest` will be used for `bpfFilter.ts`, covering BPF parsing, validation, and matching logic.
*   **Component Tests**: `React Testing Library` for `FilterBar.tsx`, verifying UI interactions and display.
*   **E2E Tests**: `Playwright` will be used for an end-to-end flow, simulating PCAP upload, BPF filter input, and verification of filtered results.

### Learnings from Previous Story

**From Story 1-9-file-reference-detection-download (Status: done)**

- **New Services Created**: `fileExtractor.ts`, `FilesTab.tsx`. These components provide models for creating new utilities and integrating new UI tabs, which is highly relevant for `bpfFilter.ts` and `FilterBar.tsx`.
- **Modified Files**: `client/src/services/indexedDb.ts`, `client/src/services/pcapParser.ts`, `client/src/components/PacketDetailView.tsx`, `client/src/services/chainOfCustodyDb.ts`, `client/src/utils/hashGenerator.ts`, `client/src/types/packet.ts`, `client/src/services/database.ts`, `README.md`. These files are key integration points for new packet-level analysis features and UI components.
- **Technical Debt**: A low-severity finding noted redundancy in the `ExtractedString` interface. This emphasizes the importance of careful design for the new `bpfFilter` interface to avoid similar issues.
- **Performance Considerations**: Warnings about performance of regex matching for large payloads and virtual scrolling for tables are noted. This reinforces the decision to use Web Workers for file reassembly and hashing, and to consider virtual scrolling for the "Files" tab if it contains many entries.
- **Review Findings**: All critical and high-severity issues identified in the previous review have been successfully resolved. The data persistence layer has been refactored to correctly use IndexedDB for packet storage, eliminating the data loss risk. FTP file reassembly has been fully implemented with control/data channel correlation. Missing component and E2E tests have been added and verified.

[Source: docs/stories/1-9-file-reference-detection-download.md#Dev-Agent-Record]

### Project Structure Notes

*   **Alignment**: This story's new files (`client/src/utils/bpfFilter.ts`, `client/src/components/FilterBar.tsx`) align with the established patterns from previous stories for placing utility logic and UI components. Type definitions will reside in `client/src/types/`.
*   **New Files**: Expect `client/src/utils/bpfFilter.ts`, `client/src/components/FilterBar.tsx`.
*   **Modified Files**: Expect modifications to `client/src/components/PacketList.tsx`, `client/src/pages/PcapAnalysisPage.tsx`, and potentially `client/src/types/packet.ts`.

### References

*   [Source: docs/epics.md#Story 2.1: BPF Filter Engine]
*   [Source: docs/architecture.md]
*   [Source: docs/requirements_context_summary.md]
*   [Source: docs/structure_alignment_summary.md]
*   [Source: docs/stories/1-9-file-reference-detection-download.md]

## Dev Agent Record

### Context Reference

- /home/jaysoncavendish/net-pack-parser/docs/stories/2-1-bpf-filter-engine.context.xml

### Agent Model Used

### Debug Log References

### Completion Notes List

- 2025-11-28: Completed Task 4.1. Created `client/src/utils/bpfFilter.test.ts` and fixed a bug in `bpfFilter.ts` where `parseBpfFilter` was not exported. All unit tests passed.
- 2025-11-28: Completed Task 4.2. Created `client/src/components/FilterBar.test.tsx`. Identified missing `client/src/components/ui/alert.tsx` and created it. All component tests passed.
- 2025-11-28: Removed Task 4.3 (E2E Tests) per user request due to diminishing returns.
- 2025-11-28: Senior Developer Review completed. Outcome: Approve.



### File List

- client/src/utils/bpfFilter.ts
- client/src/utils/bpfFilter.test.ts
- client/src/components/FilterBar.tsx
- client/src/components/FilterBar.test.tsx
- client/src/components/ui/alert.tsx
- client/src/components/PacketList.tsx
- client/src/pages/PcapAnalysisPage.tsx

## Senior Developer Review (AI)

- **Reviewer**: delphijc
- **Date**: 2025-11-28
- **Outcome**: Approve

### Summary
The BPF Filter Engine has been successfully implemented with a custom parser and validator, fully meeting the story requirements. The integration into the analysis page is seamless, and the UI provides clear feedback for both valid and invalid filters. Code quality is high, with appropriate separation of concerns between the parsing logic (`bpfFilter.ts`) and the UI (`FilterBar.tsx`).

### Key Findings

- **Low Severity**:
    - **Performance**: Filtering is currently performed synchronously on the main thread in `PcapAnalysisPage.tsx`. For very large datasets (>10k packets), this could cause UI jank. Consider moving filter execution to a Web Worker in a future optimization task.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| :--- | :--- | :--- | :--- |
| 1 | Given packets are loaded | IMPLEMENTED | `PcapAnalysisPage.tsx` loads packets from DB |
| 2 | When I enter BPF filter | IMPLEMENTED | `FilterBar.tsx` input field |
| 3 | Then system validates syntax | IMPLEMENTED | `validateBpfFilter` called in `PcapAnalysisPage.tsx` |
| 4 | And if valid, applies filter | IMPLEMENTED | `matchBpfFilter` used in `PcapAnalysisPage.tsx` |
| 5 | And displays filter status | IMPLEMENTED | `FilterBar.tsx` shows "Showing X of Y packets" |
| 6 | And if invalid, shows error | IMPLEMENTED | `FilterBar.tsx` displays `Alert` with error |
| 7 | And common BPF filters work | IMPLEMENTED | `bpfFilter.ts` supports tcp, udp, port, host, net, and/or/not |
| 8 | And I can clear the filter | IMPLEMENTED | `FilterBar.tsx` Clear button |

**Summary**: 8 of 8 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| :--- | :--- | :--- | :--- |
| 1.1 Research BPF Parser Libraries | [x] | VERIFIED COMPLETE | Custom implementation chosen and justified |
| 1.2 Create `bpfFilter.ts` | [x] | VERIFIED COMPLETE | `client/src/utils/bpfFilter.ts` exists |
| 1.3 Implement BPF Matching Logic | [x] | VERIFIED COMPLETE | `matchBpfFilter` function implemented |
| 2.1 Create `FilterBar.tsx` | [x] | VERIFIED COMPLETE | `client/src/components/FilterBar.tsx` exists |
| 2.2 Integrate `FilterBar.tsx` | [x] | VERIFIED COMPLETE | Integrated in `PcapAnalysisPage.tsx` |
| 2.3 Filter Packet List Display | [x] | VERIFIED COMPLETE | `PacketList` receives filtered packets |
| 3.1 Apply Filter to Loaded Packets | [x] | VERIFIED COMPLETE | Filtering logic in `PcapAnalysisPage.tsx` |
| 4.1 Unit Tests for `bpfFilter.ts` | [x] | VERIFIED COMPLETE | `client/src/utils/bpfFilter.test.ts` exists |
| 4.2 Component Tests for `FilterBar.tsx` | [x] | VERIFIED COMPLETE | `client/src/components/FilterBar.test.tsx` exists |
| 4.3 E2E Tests for BPF Filtering | [ ] | SKIPPED | Removed from scope per user request |

**Summary**: 9 of 9 completed tasks verified. Task 4.3 was correctly removed.

### Test Coverage and Gaps
- **Unit Tests**: Comprehensive coverage for `bpfFilter.ts` including all primitives and boolean logic.
- **Component Tests**: `FilterBar.tsx` tested for rendering, input, and error states.
- **E2E Tests**: Skipped as per decision.

### Architectural Alignment
- **Custom Parser**: Aligns with the decision to use a custom lightweight parser instead of heavy external libraries.
- **State Management**: Uses local state in `PcapAnalysisPage` which is appropriate for this scope, though moving to a global store (Zustand) might be beneficial if filtering is needed elsewhere.

### Security Notes
- **Input Validation**: BPF expressions are validated before execution, preventing injection of arbitrary code. The parser constructs an AST and the matcher evaluates it, avoiding `eval()`.

### Best-Practices and References
- **Code Style**: Consistent with project standards (TypeScript, functional components).
- **Accessibility**: Error messages use `Alert` component with appropriate roles.

### Action Items

**Advisory Notes:**
- Note: Monitor performance on large datasets and consider Web Worker offloading if needed.

