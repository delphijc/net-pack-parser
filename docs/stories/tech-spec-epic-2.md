# Epic Technical Specification: Search, Filter & Basic Analysis

Date: 2025-11-28
Author: delphijc
Epic ID: epic-2
Status: Draft

---

## Overview

Epic 2 delivers advanced packet filtering and search capabilities essential for efficient network traffic analysis. This epic enables users to quickly isolate packets of interest using BPF (Berkeley Packet Filter) syntax, multi-criteria search, and advanced filtering combinators. Building upon the foundation established in Epic 1 (PCAP parsing, packet display), Epic 2 transforms the application from a passive viewer into a powerful analysis workbench.

The epic implements a comprehensive filtering engine supporting BPF syntax (`tcp port 443`, `host 192.168.1.1`), multi-field search (IP address, port, protocol, payload content), and Boolean logic (AND/OR) for complex queries. Search results are highlighted in the packet detail view, enabling rapid visual identification of matches. All filtering and search operations execute client-side in the browser with sub-500ms response times per NFR-P3.

## Objectives and Scope

**In Scope:**
- BPF filter engine supporting standard Berkeley Packet Filter syntax
- Multi-criteria packet search (source/dest IP, port, protocol, time range, payload strings)
- Boolean logic combinators for complex filter expressions (AND/OR)
- Search result highlighting in packet list and detail views
- Filter persistence across sessions (saved to localStorage)
- Real-time filter validation with error feedback
- Performance-optimized search across 10,000+ packets

**Out of Scope:**
- Advanced BPF features like `vlan` or `mpls` filters (deferred to future)
- Regular expression search in payload (Epic 3)
- Statistical analysis of filtered results (Epic 6)
- Threat-specific filtering (Epic 3)
- Timeline filtering UI (Epic 5)
- Export of filtered results (Epic 6)

**Success Criteria:**
- Users can apply BPF filters with correct packet selection
- Search returns results within 500ms for 10,000 packets
- Filter syntax errors provide clear, actionable error messages
- Saved filters persist across browser sessions

## System Architecture Alignment

**Frontend Architecture (client/):**
- **New Component:** `client/src/utils/bpfFilter.ts` - BPF parser and filter engine
- **New Component:** `client/src/components/FilterBar.tsx` - Filter/search UI component
- **Enhanced Component:** `client/src/components/PacketList.tsx` - Integrated filtering and search result highlighting
- **State Management:** Zustand store for filter state, TanStack Query not needed (pure client-side)

**Data Flow:**
1. User enters BPF filter or search criteria in FilterBar component
2. bpfFilter.ts parses and validates syntax
3. Filter engine iterates over packets array (from Epic 1 localStorage/IndexedDB)
4. Matching packets rendered in PacketList with highlighted matches
5. Filter preferences saved to localStorage for future sessions

**Dependencies:**
- Builds directly on Epic 1's packet parsing and storage infrastructure
- No new external libraries required (custom BPF parser implementation)
- No server-side components (browser-only)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|---------|---------|-------|
| `bpfFilter.ts` | Parse BPF syntax, compile to filter function, execute filter on packet array | BPF string, packet array | Filtered packet array, syntax errors | client/src/utils |
| `FilterBar.tsx` | Render filter UI, validate input, manage filter state | User input, saved filters | Filter query, validation errors | client/src/components |
| `PacketList.tsx` (enhanced) | Display filtered packets, highlight search matches | Filtered packets, search terms | Rendered packet rows | client/src/components |
| `searchEngine.ts` | Multi-criteria search (IP, port, protocol, payload) | Search criteria object, packet array | Matching packets with highlight ranges | client/src/utils |
| `filterStore.ts` (Zustand) | Manage active filter, saved filters, filter history | Filter operations (set, clear, save) | Current filter state | client/src/store |

### Data Models and Contracts

**Filter Query Interface:**
```typescript
interface FilterQuery {
  id: string;                      // UUID
  name?: string;                   // User-defined name for saved filter
  type: 'bpf' | 'multi-criteria';  // Filter type
  bpf?: string;                    // BPF expression (e.g., "tcp port 443")
  criteria?: SearchCriteria;       // Multi-criteria search
  createdAt: number;               // Timestamp
  lastUsed?: number;               // Last application timestamp
}

interface SearchCriteria {
  sourceIP?: string;               // e.g., "192.168.1.1"
  destIP?: string;
  sourcePort?: number;
  destPort?: number;
  protocol?: string[];             // ['TCP', 'HTTP']
  timeRange?: { start: number; end: number };
  payloadContains?: string;        // String search in payload
  combinator: 'AND' | 'OR';        // Boolean logic
}

interface FilterResult {
  packets: Packet[];               // Matching packets
  totalMatches: number;
  executionTimeMs: number;         // Performance metric
  highlights?: Map<string, Range[]>; // packetId -> highlight ranges
}

interface Range {
  start: number;                   // Byte offset
  end: number;
  field: string;                   // 'sourceIP', 'payload', etc.
}
```

**BPF AST (Abstract Syntax Tree):**
```typescript
type BPFNode = 
  | { type: 'primitive'; proto?: string; dir?: string; value: string }
  | { type: 'and'; left: BPFNode; right: BPFNode }
  | { type: 'or'; left: BPFNode; right: BPFNode }
  | { type: 'not'; operand: BPFNode };
```

### APIs and Interfaces

**BPF Filter API:**
```typescript
// client/src/utils/bpfFilter.ts

/**
 * Parse BPF expression into AST
 * @throws BPFSyntaxError if invalid syntax
 */
export function parseBPF(expression: string): BPFNode;

/**
 * Compile BPF AST to executable filter function
 */
export function compileBPF(ast: BPFNode): (packet: Packet) => boolean;

/**
 * Apply BPF filter to packet array
 * @returns FilterResult with matches and performance metrics
 */
export function applyBPFFilter(expression: string, packets: Packet[]): FilterResult;

/**
 * Validate BPF syntax without executing
 * @returns { valid: boolean; error?: string; position?: number }
 */
export function validateBPF(expression: string): ValidationResult;
```

**Search Engine API:**
```typescript
// client/src/utils/searchEngine.ts

/**
 * Multi-criteria search with highlighting
 */
export function searchPackets(
  criteria: SearchCriteria,
  packets: Packet[]
): FilterResult;

/**
 * Search payload for string with highlighting
 */
export function searchPayload(
  searchTerm: string,
  packet: Packet
): { matches: boolean; ranges: Range[] };
```

**Filter Store API (Zustand):**
```typescript
// client/src/store/filterStore.ts

interface FilterStore {
  activeFilter: FilterQuery | null;
  savedFilters: FilterQuery[];
  filterHistory: FilterQuery[];
  
  // Actions
  setFilter: (filter: FilterQuery) => void;
  clearFilter: () => void;
  saveFilter: (name: string) => void;
  deleteFilter: (id: string) => void;
  loadFilter: (id: string) => void;
}
```

### Workflows and Sequencing

**BPF Filter Application Flow:**
```
1. User enters BPF expression in FilterBar (e.g., "tcp port 443 and host 192.168.1.1")
2. FilterBar validates syntax on blur/Enter using validateBPF()
3. If invalid: Display inline error with position indicator
4. If valid: Update filterStore.setFilter()
5. bpfFilter.parseBPF() creates AST
6. bpfFilter.compileBPF() generates filter function
7. applyBPFFilter() iterates packets (from IndexedDB via Epic 1)
8. PacketList re-renders with filtered packets
9. Performance metric logged (must be <500ms per NFR-P3)
```

**Multi-Criteria Search Flow:**
```
1. User opens advanced search panel
2. User enters criteria (IP, port, protocol, payload string)
3. User selects combinator (AND/OR)
4. User clicks "Search"
5. searchEngine.searchPackets() executes
6. Matching packets identified with highlight ranges
7. FilterResult returned to PacketList
8. Matches highlighted in yellow in packet list and hex dump
```

**Filter Save/Load Flow:**
```
1. User applies active filter
2. User clicks "Save Filter" button
3. FilterBar prompts for filter name
4. filterStore.saveFilter() persists to localStorage
5. Filter appears in "Saved Filters" dropdown
6. User can reload filter from dropdown later
7. filterStore.loadFilter() restores filter state
```

**Sequence Diagram (BPF Filter):**
```
User -> FilterBar: Enter "tcp port 443"
FilterBar -> bpfFilter: validateBPF("tcp port 443")
bpfFilter -> FilterBar: { valid: true }
FilterBar -> filterStore: setFilter({ type: 'bpf', bpf: '...' })
filterStore -> PacketList: state change notification
PacketList -> bpfFilter: applyBPFFilter(bpf, packets)
bpfFilter -> PacketList: FilterResult { packets: [...], totalMatches: 42 }
PacketList -> User: Display 42 matching packets
```

## Non-Functional Requirements

### Performance

**From PRD NFR-P3:** Search queries across 10,000 packets must return results within 500ms

**Targets:**
- BPF filter compilation: <50ms
- Filter execution on 10k packets: <400ms
- Search result highlighting: <50ms
- UI re-render after filter: <100ms (NFR-P4)

**Optimization Strategies:**
- Use Web Workers for filter execution on large packet sets (>5k packets)
- Implement early termination for Boolean OR operations
- Cache compiled BPF functions (memoization)
- Use binary search for sorted fields (timestamp, port numbers)
- Lazy rendering with react-window for large result sets

### Security

**From PRD NFR-S4:** Application must sanitize all user inputs to prevent XSS

**Security Measures:**
- BPF parser input sanitization: Reject non-whitelisted characters
- Prevent code injection via filter expressions (no eval() usage)
- XSS prevention: Sanitize all filter strings before rendering
- localStorage filter persistence: Validate structure before loading
- Payload search: Limit regex complexity to prevent ReDoS attacks (if regex added later)

**Threat Model:**
- Malicious BPF expressions causing DoS (mitigated by timeout on filter execution)
- Filter injection via saved filters (mitigated by schema validation)

### Reliability/Availability

**From PRD NFR-R1:** Application must handle malformed PCAP files gracefully

**Reliability Requirements:**
- Malformed BPF syntax: Graceful error messages, no crashes
- Invalid search criteria: Clear validation feedback
- Filter execution timeout: Abort after 2 seconds, display warning
- Large result sets: Pagination/virtualization to prevent UI freeze
- localStorage quota: Degrade gracefully if saved filters exceed quota

**Error Handling:**
- BPFSyntaxError: Position indicator, suggested fixes
- TimeoutError: "Filter too complex" message with optimization tips
- QuotaExceededError: Prompt to delete old saved filters

### Observability

**Logging:**
- Filter performance metrics (execution time, match count)
- BPF syntax errors with expression and position
- Filter cache hit/miss rates
- Search query patterns (anonymized)

**Metrics:**
- Filter execution duration (histogram)
- Number of saved filters per user
- Most common BPF expressions (analytics)
- Search result size distribution

**Browser DevTools:**
- Console warnings for slow filters (>500ms)
- Performance marks: filter-start, filter-end, render-start, render-end

## Dependencies and Integrations

**Internal Dependencies (Epic 1):**
- `client/src/types/packet.ts` - Packet interface
- `client/src/services/localStorage.ts` - Packet storage access
- `client/src/components/PacketList.tsx` - Enhanced for filtering
- `client/src/components/PacketDetailView.tsx` - Enhanced for highlighting

**External Libraries:**
- **None required** - Custom BPF parser implementation
- Alternative considered: `bpf-js` (rejected: unmaintained since 2016)
- Future consideration: WebAssembly BPF compiler for performance

**Browser APIs:**
- `localStorage` - Saved filters persistence
- `Web Workers` (optional) - Background filter execution
- `Performance API` - Filter execution timing

**Integration Points:**
- Zustand store integration for global filter state
- TailwindCSS for FilterBar component styling
- shadcn/ui components: Input, Button, Select, Dialog

## Acceptance Criteria (Authoritative)

**Extracted from PRD FR25-FR32:**

1. **AC-1 (FR25):** Users can filter packets using BPF syntax including: `tcp`, `udp`, `icmp`, `port <num>`, `host <ip>`, `src/dst` directives, and Boolean operators (`and`, `or`, `not`)

2. **AC-2 (FR26):** Users can search packets by source OR destination IP address with partial match support (e.g., "192.168.1" matches all in subnet)

3. **AC-3 (FR27):** Users can search packets by source OR destination port number

4. **AC-4 (FR28):** Users can filter packets by protocol type with multi-select (TCP, UDP, HTTP, HTTPS, DNS, ICMP)

5. **AC-5 (FR29):** Users can filter packets by time range using date/time pickers or relative ranges ("last hour", "last 24h")

6. **AC-6 (FR30):** Users can search packet payloads for specific strings (case-insensitive) with match highlighting

7. **AC-7 (FR31):** Users can apply multiple filter criteria simultaneously using Boolean AND/OR logic via UI toggle

8. **AC-8 (FR32):** System highlights search matches in packet details view (packet list rows, hex dump, and ASCII representation)

9. **AC-9 (Usability):** Invalid BPF syntax displays error message with position indicator and suggested correction

10. **AC-10 (Performance):** Filter/search operations complete within 500ms for datasets up to 10,000 packets (NFR-P3)

11. **AC-11 (Persistence):** Users can save named filters that persist across browser sessions in localStorage

12. **AC-12 (Persistence):** Users can load, edit, and delete saved filters from a dropdown menu

## Traceability Mapping

| AC ID | PRD Requirement | Spec Section | Component/API | Test Approach |
|-------|----------------|--------------|---------------|---------------|
| AC-1 | FR25 BPF filtering | bpfFilter.ts API | `parseBPF()`, `compileBPF()` | Unit: Test all BPF primitives |
| AC-2 | FR26 IP search | searchEngine.ts | `searchPackets()` with IP criteria | Unit: Test IP matching |
| AC-3 | FR27 Port search | searchEngine.ts | `searchPackets()` with port criteria | Unit: Test port matching |
| AC-4 | FR28 Protocol filter | searchEngine.ts | `searchPackets()` with protocol array | Unit: Multi-select logic |
| AC-5 | FR29 Time range | searchEngine.ts | `searchPackets()` with timeRange | Unit: Timestamp comparison |
| AC-6 | FR30 Payload search | searchPayload() | `searchPayload()` with highlighting | Unit: String search + ranges |
| AC-7 | FR31 Boolean logic | SearchCriteria.combinator | `searchPackets()` with AND/OR | Unit: Boolean evaluation |
| AC-8 | FR32 Highlighting | PacketDetailView highlighting | `highlights` prop rendering | Visual: Screenshot comparison |
| AC-9 | Usability | validateBPF() | `validateBPF()` error messages | Unit: Invalid syntax cases |
| AC-10 | NFR-P3 Performance | Filter execution timing | Performance.mark() logging | Load test: 10k packets, assert <500ms |
| AC-11 | Persistence | filterStore.saveFilter() | localStorage persistence | Unit: Save filter, reload page, verify loaded |
| AC-12 | Persistence UI | FilterBar saved filters UI | Filter dropdown, delete button | Unit: CRUD operations on saved filters |

## Risks, Assumptions, Open Questions

**Risks:**
- **Risk-1 (Medium):** Custom BPF parser may not support all tcpdump BPF syntax
  - *Mitigation:* Start with core subset (tcp, udp, port, host, and/or/not), add features iteratively
  - *Fallback:* Document unsupported syntax, provide error messages

- **Risk-2 (Low):** Performance degradation with very large packet sets (>50k packets)
  - *Mitigation:* Implement Web Worker offloading, pagination, time-boxed execution
  - *Monitoring:* Log filter execution times

- **Risk-3 (Low):** localStorage quota exceeded with many saved filters
  - *Mitigation:* Limit saved filters to 50, implement LRU eviction

**Assumptions:**
- **Assumption-1:** Users are familiar with BPF syntax or can learn from examples/docs
- **Assumption-2:** Packet data structure from Epic 1 includes all fields needed for filtering (IPs, ports, protocol, payload)
- **Assumption-3:** Browser performance sufficient for client-side filtering (no server offloading needed)
- **Assumption-4:** Most users will work with <10k packets per session (per NFR-P3 target)

**Open Questions:**
- **Q1:** Should we provide a visual query builder as alternative to BPF text input?
  - *Decision pending:* Defer to post-Epic 2 iteration based on user feedback
- **Q2:** Should filter history be persisted or session-only?
  - *Decision:* Session-only (in-memory) to avoid localStorage bloat, can add persistence later
- **Q3:** Regular expression support in payload search?
  - *Decision:* Out of scope for Epic 2, consider for Epic 3 (requires ReDoS protection)

## Test Strategy Summary

**Unit Tests (Vitest):**
- `bpfFilter.test.ts`: Test BPF parser with valid/invalid syntax, all primitives (tcp, udp, port, host, and, or, not)
- `searchEngine.test.ts`: Test multi-criteria search, Boolean logic, highlight range calculation
- `filterStore.test.ts`: Test Zustand store actions (save, load, delete filters)

**Component Tests (React Testing Library):**
- `FilterBar.test.tsx`: Test input validation, error display, filter submission, saved filter dropdown
- `PacketList.test.tsx`: Test filtered packet rendering, highlight display


**Performance Tests:**
- Load 10,000 packet dataset, apply various filters, measure execution time
- Use Performance.mark() and Performance.measure() APIs
- Assert all filter operations <500ms per NFR-P3

**Coverage Targets:**
- Unit test coverage: ≥90% for bpfFilter.ts and searchEngine.ts (critical logic)
- Component coverage: ≥80% for FilterBar and enhanced PacketList
