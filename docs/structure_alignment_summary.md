## Structure Alignment Summary for Story 2.2: Multi-Criteria Search

### Review of Previous Story Learnings (from Story 2.1: BPF Filter Engine)

**New Patterns/Services Created (to reuse, not recreate):**
-   `BPF Parser & Validator Implementation (client/src/utils/bpfFilter.ts)`: Provides a model for creating new utility functions for packet-level analysis. The approach taken for parsing BPF expressions and matching against packets can be adapted for parsing other complex query languages or patterns.
-   `FilterBar.tsx` (component): Demonstrates integration of a new UI component for filtering/searching and displaying status/errors. The pattern for managing filter input, applying logic, and updating the UI is reusable.
-   `client/src/utils/bpfFilter.test.ts` and `client/src/components/FilterBar.test.ts`: These test files provide a strong precedent for how to structure unit and component tests for new utilities and UI features, respectively.

**Architectural Deviations or Decisions Made:**
-   `Custom BPF parser (JavaScript BPF parser)`: This decision reinforces the preference for lightweight, client-side implementations over heavy external libraries. This approach should be continued for the multi-criteria search logic.
-   `Filtering operations should be applied in-memory and syntax validated pre-emptively to maintain responsiveness`: This performance-first approach for filtering is directly applicable to the multi-criteria search, emphasizing efficient in-memory data structures and algorithms.

**Technical Debt Deferred to Future Stories:**
-   `Performance: Filtering is currently performed synchronously on the main thread in PcapAnalysisPage.tsx. For very large datasets (>10k packets), this could cause UI jank. Consider moving filter execution to a Web Worker in a future optimization task.`: This is a critical learning. While Story 2.2 focuses on multi-criteria search, the volume of packets will increase with Epic 1, meaning that both BPF filtering and multi-criteria search might benefit from Web Workers. This should be kept in mind during implementation, especially when designing the search algorithms.

**Files Modified (understanding current state of evolving components):**
-   `client/src/components/PacketList.tsx`: This component has already been updated to receive and display filtered packets. The multi-criteria search will also need to interact with this component to display its results.
-   `client/src/pages/PcapAnalysisPage.tsx`: This page is the central hub for analysis and already integrates the `FilterBar`. The Advanced Search panel will likely be integrated here as well, and the page will manage the combined filtering logic.

### Alignment with Project Structure

The planned new components and utilities for Story 2.2 will align with the existing project structure:

-   **New Utilities**: The core search logic for IP, port, time range, and payload content should reside in `client/src/utils/` (e.g., `multiCriteriaSearch.ts` or integrated into `bpfFilter.ts` if logical).
-   **New Components**: An `AdvancedSearchPanel.tsx` component will likely be created within `client/src/components/` to house the UI for the multiple search criteria.
-   **Type Definitions**: Any new types or interfaces required for search criteria or results will be added to `client/src/types/`.

### Cross-referencing New Capabilities

From previous story, new capabilities include `bpfFilter.ts` and `FilterBar.tsx`. Story 2.2 will integrate with these:
- The multi-criteria search can be seen as an enhancement or a complementary filtering mechanism to the BPF filter. The application will need to manage how both types of filters are combined (e.g., `BPF AND Multi-Criteria Search`).
- The `PacketList.tsx` component is the display mechanism for both BPF filtered packets and multi-criteria search results, ensuring consistency in presentation.

### No `unified-project-structure.md` detected, proceeding with implicit alignment based on existing codebase.

---
