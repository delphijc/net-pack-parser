### Story 1.7: Token & String Extraction - Tasks and Subtasks

**Goal:** Implement the automatic extraction of tokens and strings from packet payloads, display them in a dedicated UI tab, and enable highlighting within the packet detail view.

---

#### 1. Data Model & Storage Design (Estimated: 0.5 days)

*   **1.1. Define `ExtractedString` Interface:**
    *   Create `client/src/types/extractedStrings.ts` with a TypeScript interface for extracted strings, including properties like `id`, `type` (IP, URL, Email, Credential, FilePath, Other), `value`, `packetId`, `offset`, `length`, `category`, and `originalPayloadOffset`.
*   **1.2. Determine Storage Strategy:**
    *   Integrate extracted strings into IndexedDB alongside packet data or establish a new object store for them. Consider performance implications for querying.

#### 2. String Extraction Logic Development (Estimated: 2 days)

*   **2.1. Create `client/src/utils/stringExtractor.ts`:**
    *   Develop a core function `extractStrings(payload: ArrayBuffer, packetId: string, payloadOffset: number)` that returns an array of `ExtractedString` objects.
*   **2.2. Implement Regex Patterns:**
    *   Add robust regex patterns for:
        *   IPv4 and IPv6 addresses.
        *   URLs (http/s, ftp schemes).
        *   Email addresses.
        *   File paths and filenames (e.g., common extensions, directory separators).
        *   Potential credentials (e.g., `username=`, `password=`, `api_key=`, `token=`, `auth=` patterns).
*   **2.3. Implement Printable ASCII String Extraction:**
    *   Develop logic to find sequences of printable ASCII characters longer than a configurable minimum length (default 4 characters) in both text and binary payloads.
*   **2.4. Offload to Web Worker (Performance Optimization):**
    *   Proactively implement the `extractStrings` logic within a Web Worker to prevent UI blocking for large packet payloads. This aligns with the warning from Story 1.6.

#### 3. Integration with PCAP Parsing & Data Persistence (Estimated: 1 day)

*   **3.1. Modify `client/src/utils/pcapParser.ts`:**
    *   After parsing `rawData` for each packet, call the `stringExtractor` (via the Web Worker API if implemented) to process the `rawData`.
    *   Store the resulting `ExtractedString` objects in IndexedDB, linking them to their respective `packetId`.

#### 4. UI Component: Extracted Strings Tab (Estimated: 2 days)

*   **4.1. Create `client/src/components/ExtractedStringsTab.tsx`:**
    *   Develop a React component to display extracted strings.
*   **4.2. Integrate into `PacketDetailView.tsx`:**
    *   Add a new tab to the `shadcn/ui` Tabs component in `PacketDetailView.tsx` for "Extracted Strings".
*   **4.3. Implement Display List:**
    *   Render extracted strings in a sortable and filterable table or list.
    *   Display `type`, `value`, and `packetId` (if not already implicitly known from context).
*   **4.4. Implement Search & Filter:**
    *   Add an input field to search through the displayed extracted strings.
    *   Add filter options by `type` (IP, URL, Email, Credential, etc.).

#### 5. Highlighting Functionality (Estimated: 1.5 days)

*   **5.1. Update `ExtractedStringsTab.tsx`:**
    *   Implement a click handler for each `ExtractedString` item that dispatches an event or calls a callback with the `offset`, `length`, and `packetId` of the selected string.
*   **5.2. Enhance `PacketDetailView.tsx` (and `HexDumpViewer.tsx`):**
    *   Receive the highlighting request.
    *   Modify `HexDumpViewer.tsx` to accept optional `highlightRanges: Array<{offset: number, length: number}>` props.
    *   Implement visual highlighting (e.g., yellow background) for the specified byte ranges within both the hex and ASCII representations in `HexDumpViewer`.

---

#### 6. Testing (Estimated: 2 days)

*   **6.1. Unit Tests for `client/src/utils/stringExtractor.ts`:**
    *   Write tests for `extractStrings` covering various valid and invalid inputs for IPs, URLs, emails, file paths, and credential patterns.
    *   Test generic ASCII string extraction with diverse payloads (text, mixed text/binary, purely binary).
    *   Verify minimum string length filtering.
*   **6.2. Component Tests for `client/src/components/ExtractedStringsTab.tsx`:**
    *   Test rendering of lists with different sets of `ExtractedString` objects.
    *   Test search functionality (e.g., filtering by keyword).
    *   Test filter by category functionality.
    *   Mock interaction to ensure clicking an item correctly triggers a highlighting event.
*   **6.3. Integration Tests for `PacketDetailView.tsx`:**
    *   Verify that `PacketDetailView` correctly displays the "Extracted Strings" tab.
    *   Simulate selecting a packet with extracted strings and verify their presence in the tab.
    *   Test the end-to-end flow of clicking an `ExtractedString` in the tab and observing the corresponding highlight in `HexDumpViewer` (mocking `HexDumpViewer` if necessary, or using a full integration test setup).
*   **6.4. Performance Testing (Advisory):**
    *   Perform basic manual performance checks with large PCAP files to ensure string extraction (especially if in a Web Worker) does not significantly degrade UI responsiveness.

---
