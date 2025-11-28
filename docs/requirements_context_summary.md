# Requirements Context Summary: Story 2.1 - BPF Filter Engine

## Epic Overview
**Epic 2: Search, Filter & Basic Analysis**
**Goal**: Provide powerful search and filtering capabilities for efficient packet analysis.
**User Value**: Users can quickly find relevant packets using BPF filters, IP/port search, and multi-criteria filtering.

## Story Statement
As a **security analyst**,
I want to **apply Berkeley Packet Filter (BPF) syntax to filter packets**,
So that I can **use industry-standard filtering expressions I already know** to efficiently analyze network traffic.

## Acceptance Criteria (from epics.md)

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

## Functional Requirements Covered (from prd.md / epics.md)
*   **FR25**: Users can filter packets using BPF (Berkeley Packet Filter) syntax

## Architectural Guidance & Constraints (from architecture.md)

*   **BPF Filtering**: Custom implementation (JavaScript BPF parser)
*   **Component Placement**:
    *   `client/src/utils/bpfFilter.ts` (for the BPF parser logic)
    *   `client/src/components/FilterBar.tsx` (for the UI input and display)
    *   `PacketList.tsx` (to integrate search logic for displaying filtered packets)
*   **Technology Stack**: Frontend will use React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
*   **Performance**: Filters should be applied in-memory (fast for moderate packet counts).
*   **Testing**: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E tests.

## Technical Notes (from epics.md)

*   Implement BPF parser in JavaScript (or use existing library like `bpf.js`).
*   Support common BPF primitives: `host`, `net`, `port`, `tcp`, `udp`, `icmp`, `src`, `dst`.
*   Support boolean operators: `and`, `or`, `not`.
*   Validate syntax before applying to avoid performance issues.
*   Apply filter in-memory (fast for moderate packet counts).

## Prerequisites (from epics.md)
*   Story 1.4: PCAP File Upload & Parsing (ensures packets are loaded in the application)