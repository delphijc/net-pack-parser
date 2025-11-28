# Tasks / Subtasks: Story 2.1 - BPF Filter Engine

#### Overall Goal: Implement a client-side Berkeley Packet Filter (BPF) engine for real-time packet filtering within the application.

#### Estimated Time: 6 days

## 1. BPF Parser & Validator Implementation (2.5 days)

*   [ ] **1.1. Research BPF Parser Libraries (0.5 days)**
    *   **Task**: Investigate existing JavaScript BPF parser libraries (e.g., `bpf.js`, `pcap-parser`'s internal BPF logic) or specifications for implementing a custom one. (Ref: `epics.md` Technical Notes, `architecture.md` BPF Filtering)
    *   **Subtask**: Evaluate pros/cons of using an existing library vs. custom implementation based on project conventions (lightweight, modularity, TypeScript compatibility).
*   [ ] **1.2. Create `client/src/utils/bpfFilter.ts` (1.0 day)**
    *   **Task**: Implement the core BPF parsing and validation logic.
    *   **Subtask**: Support common BPF primitives: `host`, `net`, `port`, `tcp`, `udp`, `icmp`, `src`, `dst`.
    *   **Subtask**: Support boolean operators: `and`, `or`, `not`.
    *   **Subtask**: Implement syntax validation that returns clear error messages for invalid expressions (AC 3, AC 6).
*   [ ] **1.3. Implement BPF Matching Logic (1.0 day)**
    *   **Task**: Develop a function within `bpfFilter.ts` that takes a parsed BPF expression and a `Packet` object, returning `true` if the packet matches the filter, `false` otherwise. (AC 4, AC 7)
    *   **Subtask**: Ensure correct matching for various filter types (IP addresses, port ranges, protocols).
    *   **Subtask**: Integrate with `Packet` interface for efficient access to packet metadata.

## 2. UI Component Development & Integration (2.0 days)

*   [ ] **2.1. Create `client/src/components/FilterBar.tsx` (1.0 day)**
    *   **Task**: Develop a new React component for the BPF filter input field and status display. (AC 2)
    *   **Subtask**: Include an input field for BPF expressions.
    *   **Subtask**: Display filter status (e.g., "Showing X of Y packets") (AC 5).
    *   **Subtask**: Display inline error messages for invalid BPF syntax (AC 6).
    *   **Subtask**: Implement a "Clear Filter" button (AC 8).
    *   **Subtask**: Use `shadcn/ui` components for styling (Input, Button, Alert for errors).
*   [ ] **2.2. Integrate `FilterBar.tsx` into `PcapAnalysisPage.tsx` (0.5 days)**
    *   **Task**: Place the `FilterBar` component prominently on the PCAP Analysis page.
    *   **Subtask**: Establish state management for the BPF expression and filter results (e.g., using Zustand).
*   [ ] **2.3. Filter Packet List Display (0.5 days)**
    *   **Task**: Modify `client/src/components/PacketList.tsx` to receive a filtered list of packets and display them. (AC 4)
    *   **Subtask**: Update the displayed packet count to reflect the filtered results (AC 5).

## 3. Integration with Packet Data (0.5 days)

*   [ ] **3.1. Apply Filter to Loaded Packets (0.5 days)**
    *   **Task**: In the `PcapAnalysisPage.tsx` or a dedicated service, apply the `bpfFilter.ts` matching logic to the currently loaded packets whenever the BPF expression changes. (AC 1, AC 4)
    *   **Subtask**: Ensure filtering is performed in-memory efficiently. (Ref: `epics.md` Technical Notes)
    *   **Subtask**: Manage the state of filtered packets and pass them down to `PacketList.tsx`.

## 4. Testing (1.0 day)

*   [ ] **4.1. Unit Tests for `bpfFilter.ts` (0.5 days)**
    *   **Task**: Write comprehensive unit tests for BPF parsing, validation, and matching logic. (Ref: `architecture.md` Testing)
    *   **Subtask**: Test valid BPF expressions (`tcp port 80`, `host 1.2.3.4`, `src net 10.0.0.0/8 and not port 22`).
    *   **Subtask**: Test invalid BPF expressions (syntax errors, unknown primitives).
    *   **Subtask**: Test edge cases (empty filter, very long filter).
*   [ ] **4.2. Component Tests for `FilterBar.tsx` (0.25 days)**
    *   **Task**: Write component tests using React Testing Library. (Ref: `architecture.md` Testing)
    *   **Subtask**: Verify input changes, error message display, and "Clear Filter" button functionality.
    *   **Subtask**: Simulate valid and invalid filter submissions.
*   [ ] **4.3. E2E Tests for BPF Filtering (0.25 days)**
    *   **Task**: Create an E2E test using Playwright. (Ref: `architecture.md` Testing)
    *   **Subtask**: Upload a PCAP file (Story 1.4 prerequisite).
    *   **Subtask**: Enter a valid BPF filter and verify that the packet list updates correctly and the status message is accurate.
    *   **Subtask**: Enter an invalid BPF filter and verify the error message is displayed.
    *   **Subtask**: Clear the filter and verify all packets are shown again.

## 5. Documentation (Optional, as part of Dev Notes)

*   [ ] **5.1. Inline Code Comments & JSDoc (N/A days)**
    *   **Task**: Add comments to complex logic in `bpfFilter.ts` and `FilterBar.tsx`.
