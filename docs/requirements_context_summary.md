## Requirements Context Summary for Story 2.2: Multi-Criteria Search

### Story Statement
As a security analyst,
I want to search packets by IP, port, protocol, time range, and payload content,
So that I can find specific packets using multiple criteria.

### Source: epics.md (Epic 2: Search, Filter & Basic Analysis)
**Goal:** Provide powerful search and filtering capabilities for efficient packet analysis.
**User Value:** Users can quickly find relevant packets using BPF filters, IP/port search, and multi-criteria filtering.

#### Acceptance Criteria (ACs) for Story 2.2: Multi-Criteria Search (from epics.md)
1.  **Given** packets are loaded in the application
2.  **When** I use the Advanced Search panel
3.  **Then** I can specify multiple search criteria:
    *   Source IP (exact match or CIDR notation)
    *   Destination IP (exact match or CIDR notation)
    *   Source Port (exact or range: 80-443)
    *   Destination Port (exact or range)
    *   Protocol (dropdown: TCP, UDP, ICMP, HTTP, HTTPS, DNS, etc.)
    *   Time Range (from timestamp to timestamp, with date pickers)
    *   Payload Contains (string search in packet data, case-sensitive option)
4.  **And** I can combine criteria with AND/OR logic using radio buttons
5.  **And when** I click "Search", results appear in the packet table
6.  **And** search completes in <500ms for 10,000 packets (per NFR-P3)
7.  **And** search matches are highlighted in the packet list
8.  **And** I can save frequently used searches as "Saved Searches"

### Source: prd.md
#### Functional Requirements (FRs) covered by this story:
-   **FR26**: Users can search packets by IP address (source or destination)
-   **FR27**: Users can search packets by port number
-   **FR28**: Users can search packets by protocol type
-   **FR29**: Users can search packets by time range
-   **FR30**: Users can search packet payloads for specific strings or patterns
-   **FR31**: Users can apply multiple filter criteria simultaneously (Boolean AND/OR logic)
-   **FR32**: System highlights search matches in packet details view (This is actually covered in Story 2.3: Search Result Highlighting, but mentioned here for completeness of multi-criteria search context)

#### Non-Functional Requirements (NFRs) relevant to this story:
-   **NFR-P3**: Search queries across 10,000 packets must return results within 500ms.
-   **NFR-M1**: Codebase must maintain TypeScript strict mode.
-   **NFR-M2**: All components must include prop types and JSDoc comments.
-   **NFR-M3**: Test coverage must be ≥ 80% for critical analysis logic.

### Source: architecture.md
#### Architectural Patterns and Constraints relevant to this story:
-   **Frontend Framework**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
-   **State Management**: Zustand (for UI state like search criteria, selected filters), TanStack Query (if search involves server-side operations, but this story is browser-only).
-   **Performance**: Search operations must be fast; consider indexed search for IP/ports and efficient string search algorithms for payload.
-   **Testing**: Vitest (unit), React Testing Library (component).
-   **Project Structure**: New components/utilities will reside in `client/src/components/` and `client/src/utils/`.

### Source: ux-design-specification.md
#### UX Principles and Components relevant to this story:
-   **Defining Experience**: Users should feel "Empowered and in Control" - the search should be precise and efficient.
-   **Novel UX Patterns**: Drill-Down (from high-level to detailed results).
-   **Component Strategy**: Use `shadcn/ui` for input fields, buttons, and potentially a complex "Advanced Search panel" component.
-   **Consistency Rules**: High Density, High Clarity. Every action must have immediate visual feedback.
-   **Key Components to Build**: `FilterBar` (conceptually similar to an Advanced Search panel).

### Source: tech-spec-epic-1.md (Previous Epic's Tech Spec)
-   Provides context on the established tech stack and foundational components used in Epic 1, which this story will build upon. Notably, `PacketList.tsx` and the `Packet` data model will be central to displaying search results.

---
_Note: `{{non_interactive}}` is true, so no clarification will be asked from the user._
