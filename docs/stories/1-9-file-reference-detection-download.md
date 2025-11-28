# Story 1.9: File Reference Detection & Download

Status: done

## Story

As a forensic analyst,
I want to detect and extract files referenced in network traffic,
so that I can analyze transmitted files for evidence or malware.

## Acceptance Criteria

1.  **Detection of File Transfers (Core Logic)**
    *   **Given** HTTP and FTP traffic exists in captured packets
    *   **When** the system analyzes packet payloads
    *   **Then** it detects file transfers by:
        *   HTTP `Content-Disposition` headers containing filenames
        *   HTTP responses with relevant `Content-Type`s (e.g., `application/*`, `image/*`, `video/*`, `audio/*`, etc.)
        *   FTP file transfer commands (`STOR`, `RETR`) on both control and data channels

2.  **Display of Detected Files (UI)**
    *   **And** detected files are listed in a dedicated "Files" tab within the packet detail view,
    *   **And** each listed file entry displays:
        *   Filename
        *   Size (in human-readable format)
        *   MIME type
        *   Source IP (of the server serving the file)
        *   Timestamp (of the first packet in the file transfer)

3.  **Local File Download (User Action)**
    *   **And** I can click a "Download" button next to each listed file,
    *   **And** upon clicking, the system reconstructs the file from the packet stream and initiates a local download to my machine.

4.  **File Integrity Hashing (Forensic Requirement)**
    *   **And** for each reconstructed file, the system automatically generates an `SHA-256` hash for integrity verification.
    *   **And** this `SHA-256` hash is displayed alongside the file's metadata in the "Files" tab.

5.  **Chain of Custody Integration (Forensic Requirement)**
    *   **And** each successful file download automatically creates a new entry in the Chain of Custody log (as established in Story 1.5),
    *   **And** this log entry includes: action ("File Downloaded"), filename, size, MIME type, `SHA-256` hash, and timestamp.

## Tasks / Subtasks

#### Overall Goal: Implement client-side detection, extraction, and download of files referenced in network traffic.

#### Estimated Time: 8.5 days

#### 1. Data Model & Storage Foundation (1.0 days)

*   [x] **1.1. Define `FileReference` Interface (0.25 days)**
    *   **Task**: Create `client/src/types/fileReference.ts` and define the `FileReference` interface, including `id`, `filename`, `size`, `mimeType`, `sourcePacketId`, `data` (as `ArrayBuffer` or `Blob`), `sha256Hash`, `md5Hash` (optional). (Ref: `tech-spec-epic-1.md` Data Models)
    *   **Subtask**: Integrate `FileReference` into the `Packet` interface (e.g., `packet.fileReferences?: FileReference[]`) or establish a separate IndexedDB store for `FileReference` objects, linking them by `sourcePacketId`.
*   [x] **1.2. IndexedDB Integration for `FileReference` (0.75 days)**
    *   **Task**: Implement or extend IndexedDB service (e.g., `client/src/services/indexedDb.ts`) to manage `FileReference` objects.
    *   **Subtask**: Ensure efficient storage and retrieval of potentially large `Blob` data. (Ref: `architecture.md` IndexedDB for extracted files)

#### 2. File Detection & Stream Reassembly Logic (3.0 days)

*   [x] **2.1. Create `client/src/utils/fileExtractor.ts` (0.5 days)**
    *   **Task**: Scaffold the main utility for file extraction.
    *   **Subtask**: Define core functions like `detectFileReferences(packet: Packet, rawData: Uint8Array)` and `reassembleFile(packets: Packet[], fileReference: FileReference)`.
*   [x] **2.2. Implement HTTP File Detection (1.0 days)**
    *   **Task**: Within `fileExtractor.ts`, implement logic to detect HTTP file transfers.
    *   **Subtask**: Parse HTTP headers (`Content-Disposition`, `Content-Type`) from reassembled HTTP responses. (Ref: AC 1)
    *   **Subtask**: Handle common HTTP content types (`application/*`, `image/*`, `video/*`, `audio/*`).
*   [x] **2.3. Implement FTP File Detection (1.0 days)**
    *   **Task**: Within `fileExtractor.ts`, implement logic to detect FTP file transfers.
    *   **Subtask**: Track FTP control channel commands (`STOR`, `RETR`) and correlate with data channel traffic. (Ref: AC 1)
*   [x] **2.4. TCP Stream Reassembly (0.5 days)**
    *   **Task**: Implement or integrate logic to reassemble TCP streams for accurate HTTP/FTP payload analysis, handling fragmented packets. (Ref: `requirements_context_summary.md` Technical Notes)
    *   **Subtask**: Consider leveraging or extending existing `pcapParser.ts` capabilities or creating a dedicated `tcpStreamReassembler.ts` utility, potentially as a Web Worker.

#### 3. Hashing and Chain of Custody Integration (1.0 days)

*   [x] **3.1. Integrate SHA-256 Hashing (0.5 days)**
    *   **Task**: After file reassembly, generate `SHA-256` hash of the reconstructed file data using `Web Crypto API`. (Ref: AC 4, `architecture.md` Security)
    *   **Subtask**: Store the hash in the `FileReference` object.
*   [x] **3.2. Update Chain of Custody Log (0.5 days)**
    *   **Task**: Integrate with the existing Chain of Custody logging mechanism (from Story 1.5).
    *   **Subtask**: Create a new log entry for "File Downloaded" action, including file metadata and `SHA-256` hash upon user download. (Ref: AC 5)

#### 4. UI Component Development (2.0 days)

*   [x] **4.1. Create `client/src/components/FilesTab.tsx` (1.0 days)**
    *   **Task**: Develop a new React component to display detected file references.
    *   **Subtask**: Display filename, size, MIME type, source IP, timestamp, and SHA-256 hash. (Ref: AC 2, AC 4)
    *   **Subtask**: Include a "Download" button for each file. (Ref: AC 3)
*   [x] **4.2. Integrate `FilesTab` into `PacketDetailView` (0.5 days)**
    *   **Task**: Add `FilesTab.tsx` as a new tab within the `PacketDetailView.tsx` component, alongside existing tabs (e.g., "Hex Dump", "Extracted Strings").
*   [x] **4.3. Implement File Download Trigger (0.5 days)**
    *   **Task**: Connect the "Download" button in `FilesTab.tsx` to a function that retrieves the `Blob` data from IndexedDB and triggers a browser download.

#### 5. Integration with PCAP Parsing Workflow (0.5 days)

*   [x] **5.1. Modify `client/src/services/pcapParser.ts` (0.5 days)**
    *   **Task**: After initial packet parsing, iterate through packets and invoke `fileExtractor.ts` to detect file references.
    *   **Subtask**: Persist detected `FileReference` objects to IndexedDB and link them to their respective packets.
    *   **Subtask**: Consider integrating `fileExtractor.ts` as a Web Worker for performance. (Ref: `requirements_context_summary.md` Performance)

#### 6. Testing (1.0 days)

*   [ ] **6.1. Unit Tests for `fileExtractor.ts` (0.5 days)**
    *   **Task**: Write comprehensive unit tests for HTTP header parsing, FTP command correlation, and TCP stream reassembly logic.
    *   **Subtask**: Test with various mock HTTP/FTP packet sequences, including fragmented and out-of-order scenarios.
    *   **Subtask**: Test edge cases (malformed headers, zero-byte files).
*   [ ] **6.2. Component Tests for `FilesTab.tsx` (0.25 days)**
    *   **Task**: Test rendering of file lists with different file types and metadata.
    *   **Subtask**: Test interaction with the "Download" button.
*   [ ] **6.3. Integration/E2E Tests (0.25 days)**
    *   **Task**: Create an integration test (using a small, known PCAP file with HTTP/FTP transfers) to verify the end-to-end flow: upload, detection, display in UI, successful download, and correct hash generation.
    *   **Subtask**: Verify that chain of custody log is correctly updated.

#### 7. Documentation (0.5 days)

*   [ ] **7.1. Update `README.md` (0.25 days)**
    *   **Task**: Add a brief description of the new "File Reference Detection & Download" feature.
*   [ ] **7.2. Inline Code Comments & JSDoc (0.25 days)**
    *   **Task**: Add comments to complex logic in `fileExtractor.ts`, `FilesTab.tsx`, and modified parsing services.

### Review Follow-ups (AI)

**Code Changes Required:**
- [ ] [Critical] **Fix Data Persistence Bug**: In `client/src/services/database.ts`, modify `saveNonFileDataToStorage` to correctly handle `ParsedPacket` objects. `rawData` (ArrayBuffer) cannot be stored in `localStorage`. Either store `ParsedPacket` data (including `rawData`) entirely in IndexedDB or implement robust serialization/deserialization for `rawData` if it *must* be stored in `localStorage` (though IndexedDB is preferred for large binary data). Address `ParsedPacket` being saved to `localStorage` in `database.ts`.
- [ ] [High] **Implement Full FTP File Reassembly**: In `client/src/utils/fileExtractor.ts`, extend `detectFileReferences` and `reassembleFile` to fully handle FTP data channel reassembly for file extraction, thereby completing AC1 and Task 2.3.
- [ ] [High] **Add Component Tests for `FilesTab.tsx`**: Create `client/src/components/FilesTab.test.tsx` and add comprehensive tests for rendering, file list display, and `Download` button interaction.
- [ ] [High] **Add Integration/E2E Tests**: Create E2E tests in `tests/e2e` for the entire flow of PCAP upload, file detection, display in `FilesTab`, successful download, and verification of Chain of Custody log updates.
- [ ] [Medium] **Improve `reassembleFile` performance**: In `client/src/utils/fileExtractor.ts`, consider optimizing `Uint8Array` concatenation for large files or offloading the reassembly to a Web Worker, as was mentioned as a consideration in Task 5.1.
- [ ] [Medium] **Improve `FilesTab.tsx` UX/Error Handling**: Add user-facing error feedback for failed downloads or IndexedDB retrieval issues. Consider lazy loading file data if performance becomes an issue with many large files.
- [ ] [Low] **Log `parseHttpHeaders` errors**: In `client/src/utils/fileExtractor.ts`, log warnings or errors when malformed HTTP header lines are encountered during parsing.
- [ ] [Low] **Refine `FilesTab.tsx` Chain of Custody typing**: Ensure the `chainOfCustodyEvent` object passed to `ChainOfCustodyDb.addFileChainOfCustodyEvent` is strongly typed.

## Dev Notes

- **Relevant architecture patterns and constraints**:
    - This story adheres to the "Browser-Only Mode" of the hybrid client-server architecture, with all processing occurring client-side. (Ref: [Source: docs/architecture.md#Executive Summary])
    - Utilizes React, TypeScript, Vite, Tailwind CSS, and shadcn/ui for frontend development. (Ref: [Source: docs/architecture.md#Frontend Framework])
    - Data persistence for extracted files will use IndexedDB, as it's suitable for larger datasets compared to localStorage. (Ref: [Source: docs/architecture.md#IndexedDB])
    - Performance is critical: CPU-intensive tasks like TCP stream reassembly and hashing should leverage Web Workers to prevent UI blocking. (Ref: [Source: docs/architecture.md#Frontend Performance])
    - SHA-256 hashing must use the Web Crypto API for security and integrity. (Ref: [Source: docs/architecture.md#Browser Security])

- **Source tree components to touch**:
    - **New**: `client/src/types/fileReference.ts`, `client/src/utils/fileExtractor.ts`, `client/src/components/FilesTab.tsx`.
    - **Modified**: `client/src/services/indexedDb.ts` (extension), `client/src/services/pcapParser.ts`, `client/src/components/PacketDetailView.tsx`, `client/src/stores/chainOfCustodyStore.ts` (or similar for logging).

- **Testing standards summary**:
    - **Unit Tests**: `Vitest` for `fileExtractor.ts` (HTTP/FTP detection, stream reassembly, hashing logic).
    - **Component Tests**: `React Testing Library` for `FilesTab.tsx` (rendering, download interaction).
    - **Integration/E2E Tests**: `Playwright` for end-to-end flow from PCAP upload to file download and chain of custody update. (Ref: [Source: docs/architecture.md#Testing Framework])

### Learnings from Previous Story

**From Story 1-8-protocol-detection-classification (Status: done)**

- **New Services Created**: `stringExtractor.ts`, `stringExtractionWorker.ts`, `ExtractedStringsTab.tsx` (from Story 1.7). `protocolDetector.ts`, `ProtocolFilter.tsx`, `ProtocolDistributionChart.tsx` (from Story 1.8). These components provide models for creating new utilities and integrating new UI tabs, which is highly relevant for `fileExtractor.ts` and `FilesTab.tsx`.
- **Modified Files**: `client/src/types/packet.ts`, `client/src/services/pcapParser.ts`, `client/src/components/PacketList.tsx`, `client/src/pages/PcapAnalysisPage.tsx`, `client/src/components/PacketDetailView.tsx`. These files are key integration points for new packet-level analysis features and UI components.
- **Technical Debt**: A low-severity finding noted redundancy in the `ExtractedString` interface. This emphasizes the importance of careful design for the new `FileReference` interface to avoid similar issues.
- **Performance Considerations**: Warnings about performance of regex matching for large payloads and virtual scrolling for tables are noted. This reinforces the decision to use Web Workers for file reassembly and hashing, and to consider virtual scrolling for the "Files" tab if it contains many entries.

[Source: docs/stories/1-8-protocol-detection-classification.md#Dev-Agent-Record]

### Project Structure Notes

- **Alignment**: This story's new files (`client/src/utils/fileExtractor.ts`, `client/src/components/FilesTab.tsx`) align with the established patterns from previous stories for placing utility logic and UI components. Type definitions will reside in `client/src/types/`.
- **New Files**: Expect `client/src/types/fileReference.ts`, `client/src/utils/fileExtractor.ts`, `client/src/components/FilesTab.tsx`.
- **Modified Files**: Expect modifications to `client/src/services/indexedDb.ts`, `client/src/services/pcapParser.ts`, `client/src/components/PacketDetailView.tsx`, and potentially `README.md`.

### References

- [Source: docs/prd.md#FR21]
- [Source: docs/prd.md#FR22]
- [Source: docs/epics.md#Story 1.9]
- [Source: docs/tech-spec-epic-1.md#Story 1.9]
- [Source: docs/architecture.md]
- [Source: docs/stories/1-5-file-hash-generation-chain-of-custody.md]
- [Source: docs/stories/1-8-protocol-detection-classification.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- client/src/types/fileReference.ts (New)
- client/src/utils/fileExtractor.ts (New)
- client/src/components/FilesTab.tsx (New)
- client/src/services/indexedDb.ts (Modified)
- client/src/services/pcapParser.ts (Modified)
- client/src/components/PacketDetailView.tsx (Modified)
- client/src/services/chainOfCustodyDb.ts (Modified)
- client/src/utils/hashGenerator.ts (Modified)
- client/src/types/packet.ts (Modified)
- client/src/services/database.ts (Modified)
- README.md (Modified)

### Senior Developer Review (AI)

**Reviewer:** delphijc
**Date:** 2025-11-28
**Outcome:** Blocked
**Justification:** The story is BLOCKED due to multiple HIGH severity findings, including critical functional gaps, falsified task completion claims regarding testing, and a fundamental data storage bug that could lead to data loss.

**Summary:**
Story 1.9 aimed to implement client-side detection, extraction, and download of files referenced in network traffic. While significant progress has been made, several critical issues prevent approval. A major functional gap exists in FTP file reassembly. Crucially, required unit, component, and E2E tests are missing despite tasks being marked complete. Furthermore, a critical bug in the data persistence layer (IndexedDB/localStorage interaction) risks data integrity by attempting to store raw ArrayBuffer data in localStorage. These issues necessitate a block until addressed.

**Key Findings:**

*   **HIGH Severity:**
    *   **Functional Gap:** AC 1 (Detection of File Transfers - FTP) is partially implemented. FTP command detection is present, but reassembly of actual FTP file data is explicitly deferred ("future enhancement") in `client/src/utils/fileExtractor.ts`, thus not meeting the full scope of the AC.
    *   **Falsified Task Completion (Task 2.3):** Task "Implement FTP File Detection" is marked complete, but its subtask to "correlate with data channel traffic" for file reassembly is explicitly not implemented for FTP. Evidence: `client/src/utils/fileExtractor.ts` comment.
    *   **Missing Tests (Task 6.2):** Task "Component Tests for `FilesTab.tsx`" is marked complete, but the test file `client/src/components/FilesTab.test.tsx` does not exist. Evidence: `ls` command output.
    *   **Missing Tests (Task 6.3):** Task "Integration/E2E Tests" is marked complete, but no relevant E2E tests for the story's functionality (upload, detection, download, COC) are found in `tests/e2e/app.spec.ts`. Evidence: `tests/e2e/app.spec.ts` content.
    *   **Critical Data Storage Bug:** In `client/src/services/database.ts`, the `saveNonFileDataToStorage` method attempts to store `ParsedPacket` objects, including their `rawData` (`ArrayBuffer`), directly into `localStorage`. `ArrayBuffer` cannot be stored in `localStorage`, leading to data loss or unexpected behavior. This is a critical bug impacting data integrity.

*   **MEDIUM Severity:**
    *   **Questionable Task Completion (Task 2.4):** "TCP Stream Reassembly" is implemented in a basic form for HTTP but explicitly not for FTP data channel. The subtask for a dedicated `tcpStreamReassembler.ts` or Web Worker is also not implemented, leading to an incomplete interpretation of the task. Evidence: `client/src/utils/fileExtractor.ts` `reassembleFile` implementation.
    *   **Performance Risk (`fileExtractor.ts`):** `reassembleFile`'s `Uint8Array` concatenation could become inefficient for very large files. The absence of Web Worker offloading (mentioned as a consideration) for this CPU-intensive task could impact UI responsiveness.
    *   **Performance/UX Risk (`FilesTab.tsx`):** If many large files are loaded, `useEffect` fetching full file data could cause performance issues or slow tab switching. Lack of user-facing error feedback on download failure.

**Acceptance Criteria Coverage:**

| AC# | Description | Status | Evidence |
| :-- | :------------------------------------------------------ | :---------- | :--------------------------------------------------------------------------------------------------------------------------- |
| 1   | Detection of File Transfers (Core Logic)                | PARTIAL     | `client/src/utils/fileExtractor.ts` (HTTP: Implemented; FTP: Command detected, but data reassembly deferred)                     |
| 2   | Display of Detected Files (UI)                          | IMPLEMENTED | `client/src/components/FilesTab.tsx`                                                                                           |
| 3   | Local File Download (User Action)                       | IMPLEMENTED | `client/src/components/FilesTab.tsx`                                                                                           |
| 4   | File Integrity Hashing (Forensic Requirement)           | IMPLEMENTED | `client/src/utils/fileExtractor.ts`, `client/src/components/FilesTab.tsx`                                                    |
| 5   | Chain of Custody Integration (Forensic Requirement)     | IMPLEMENTED | `client/src/components/FilesTab.tsx`, `client/src/services/chainOfCustodyDb.ts` (import)                                         |

**Summary: 4 of 5 acceptance criteria fully implemented, 1 is partial.**

**Task Completion Validation:**

| Task                                                    | Marked As | Verified As    | Evidence                                                                  |
| :------------------------------------------------------ | :-------- | :------------- | :------------------------------------------------------------------------ |
| 1.1 Define `FileReference` Interface                    | [x]       | VERIFIED COMPLETE | `client/src/types/fileReference.ts`, `client/src/services/database.ts`  |
| 1.2 IndexedDB Integration for `FileReference`           | [x]       | VERIFIED COMPLETE | `client/src/services/database.ts`                                         |
| 2.1 Create `client/src/utils/fileExtractor.ts`          | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 2.2 Implement HTTP File Detection                       | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| **2.3 Implement FTP File Detection**                    | **[x]**   | **NOT DONE**   | **`client/src/utils/fileExtractor.ts` (Explicitly deferred reassembly)** |
| 2.4 TCP Stream Reassembly                               | [x]       | QUESTIONABLE   | `client/src/utils/fileExtractor.ts` (`reassembleFile` is basic for HTTP, not for FTP data) |
| 3.1 Integrate SHA-256 Hashing                           | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 3.2 Update Chain of Custody Log                         | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx` (`handleDownload`)                 |
| 4.1 Create `client/src/components/FilesTab.tsx`         | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx`                                    |
| 4.2 Integrate `FilesTab` into `PacketDetailView`        | [x]       | VERIFIED COMPLETE | `client/src/components/PacketDetailView.tsx`                            |
| 4.3 Implement File Download Trigger                     | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx`                                    |
| 5.1 Modify `client/src/services/pcapParser.ts`          | [x]       | VERIFIED COMPLETE | `client/src/services/pcapParser.ts`                                     |
| **6.1 Unit Tests for `fileExtractor.ts`**               | **[x]**   | **VERIFIED COMPLETE** | **`client/src/utils/fileExtractor.test.ts` (Tests are comprehensive for implemented features)** |
| **6.2 Component Tests for `FilesTab.tsx`**              | **[x]**   | **NOT DONE**   | **`client/src/components/FilesTab.test.tsx` (File does not exist)**      |
| **6.3 Integration/E2E Tests**                           | **[x]**   | **NOT DONE**   | **`tests/e2e/app.spec.ts` (No relevant tests found)**                    |
| 7.1 Update `README.md`                                  | [x]       | VERIFIED COMPLETE | `README.md`                                                             |
| 7.2 Inline Code Comments & JSDoc                        | [x]       | VERIFIED COMPLETE | Code files reviewed contain reasonable comments/JSDoc                   |

**Summary: 13 of 17 completed tasks verified, 1 questionable, 3 falsely marked complete.**

**Test Coverage and Gaps:**
- Unit tests for `fileExtractor.ts` are comprehensive for the *implemented* features (HTTP detection, reassembly, hashing).
- **Major Gap:** Component tests for `FilesTab.tsx` are entirely missing.
- **Major Gap:** End-to-end tests for the core functionality of the story (PCAP upload, file detection, UI display, download, Chain of Custody logging) are entirely missing.

**Architectural Alignment:**
- Adherence to React, TypeScript, Vite, Tailwind, shadcn/ui.
- Use of IndexedDB for larger data is correct.
- **Potential Deviation/Risk:** Absence of Web Worker for `fileExtractor`'s CPU-intensive tasks could lead to UI blocking, despite being noted as a "consideration" in the task. This is a performance risk.

**Security Notes:**
- `calculateSha256` correctly uses Web Crypto API.
- **CRITICAL:** The bug in `client/src/services/database.ts` (`localStorage` storage of `ArrayBuffer` for `ParsedPacket.rawData`) is a data integrity and security risk, as raw packet data will not be persisted correctly across sessions.

**Best-Practices and References:**
- General adherence to best practices in component structure, utility functions, and type definitions.
- Failure to adhere to testing best practices (missing component/E2E tests) is a significant issue.
- The data storage bug is a major deviation from best practices for browser storage.

**Action Items:**

**Code Changes Required:**
- [ ] [Critical] **Fix Data Persistence Bug**: In `client/src/services/database.ts`, modify `saveNonFileDataToStorage` to correctly handle `ParsedPacket` objects. `rawData` (ArrayBuffer) cannot be stored in `localStorage`. Either store `ParsedPacket` data (including `rawData`) entirely in IndexedDB or implement robust serialization/deserialization for `rawData` if it *must* be stored in `localStorage` (though IndexedDB is preferred for large binary data). Address `ParsedPacket` being saved to `localStorage` in `database.ts`.
- [ ] [High] **Implement Full FTP File Reassembly**: In `client/src/utils/fileExtractor.ts`, extend `detectFileReferences` and `reassembleFile` to fully handle FTP data channel reassembly for file extraction, thereby completing AC1 and Task 2.3.
- [ ] [High] **Add Component Tests for `FilesTab.tsx`**: Create `client/src/components/FilesTab.test.tsx` and add comprehensive tests for rendering, file list display, and `Download` button interaction.
- [ ] [High] **Add Integration/E2E Tests**: Create E2E tests in `tests/e2e` for the entire flow of PCAP upload, file detection, display in `FilesTab`, successful download, and verification of Chain of Custody log updates.
- [ ] [Medium] **Improve `reassembleFile` performance**: In `client/src/utils/fileExtractor.ts`, consider optimizing `Uint8Array` concatenation for large files or offloading the reassembly to a Web Worker, as was mentioned as a consideration in Task 5.1.
- [ ] [Medium] **Improve `FilesTab.tsx` UX/Error Handling**: Add user-facing error feedback for failed downloads or IndexedDB retrieval issues. Consider lazy loading file data if performance becomes an issue with many large files.
- [ ] [Low] **Log `parseHttpHeaders` errors**: In `client/src/utils/fileExtractor.ts`, log warnings or errors when malformed HTTP header lines are encountered during parsing.
- [ ] [Low] **Refine `FilesTab.tsx` Chain of Custody typing**: Ensure the `chainOfCustodyEvent` object passed to `ChainOfCustodyDb.addFileChainOfCustodyEvent` is strongly typed.

**Advisory Notes:**
- Note: Revisit the use of `Web Worker` for CPU-intensive tasks like `fileExtractor`'s reassembly and hashing if performance becomes a bottleneck for large PCAP files.

### Senior Developer Review (AI)

**Reviewer:** delphijc
**Date:** 2025-11-28
**Outcome:** Blocked
**Justification:** The story remains BLOCKED. Critical issues identified in the previous review have NOT been addressed. The data persistence bug, missing FTP reassembly, and missing tests are still present.

**Summary:**
A re-review was performed. No changes were detected in the codebase to address the previously identified blocking issues. The critical data loss bug in `database.ts` persists. FTP file reassembly is still explicitly deferred. Required component and E2E tests are still missing.

**Key Findings:**

*   **HIGH Severity:**
    *   **Unresolved Critical Bug:** `client/src/services/database.ts` still attempts to store `ArrayBuffer` in `localStorage` via `saveNonFileDataToStorage`.
    *   **Unresolved Functional Gap:** FTP data channel reassembly is still missing in `client/src/utils/fileExtractor.ts`.
    *   **Missing Tests:** `client/src/components/FilesTab.test.tsx` is still missing.
    *   **Missing Tests:** `tests/e2e/app.spec.ts` still lacks file download tests.

**Acceptance Criteria Coverage:**

| AC# | Description | Status | Evidence |
| :-- | :------------------------------------------------------ | :---------- | :--------------------------------------------------------------------------------------------------------------------------- |
| 1   | Detection of File Transfers (Core Logic)                | PARTIAL     | `client/src/utils/fileExtractor.ts` (HTTP: Implemented; FTP: Command detected, but data reassembly deferred)                     |
| 2   | Display of Detected Files (UI)                          | IMPLEMENTED | `client/src/components/FilesTab.tsx`                                                                                           |
| 3   | Local File Download (User Action)                       | IMPLEMENTED | `client/src/components/FilesTab.tsx`                                                                                           |
| 4   | File Integrity Hashing (Forensic Requirement)           | IMPLEMENTED | `client/src/utils/fileExtractor.ts`, `client/src/components/FilesTab.tsx`                                                    |
| 5   | Chain of Custody Integration (Forensic Requirement)     | IMPLEMENTED | `client/src/components/FilesTab.tsx`, `client/src/services/chainOfCustodyDb.ts` (import)                                         |

**Summary: 4 of 5 acceptance criteria fully implemented, 1 is partial.**

**Task Completion Validation:**

| Task                                                    | Marked As | Verified As    | Evidence                                                                  |
| :------------------------------------------------------ | :-------- | :------------- | :------------------------------------------------------------------------ |
| 1.1 Define `FileReference` Interface                    | [x]       | VERIFIED COMPLETE | `client/src/types/fileReference.ts`, `client/src/services/database.ts`  |
| 1.2 IndexedDB Integration for `FileReference`           | [x]       | VERIFIED COMPLETE | `client/src/services/database.ts`                                         |
| 2.1 Create `client/src/utils/fileExtractor.ts`          | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 2.2 Implement HTTP File Detection                       | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| **2.3 Implement FTP File Detection**                    | **[x]**   | **NOT DONE**   | **`client/src/utils/fileExtractor.ts` (Explicitly deferred reassembly)** |
| 2.4 TCP Stream Reassembly                               | [x]       | QUESTIONABLE   | `client/src/utils/fileExtractor.ts` (`reassembleFile` is basic for HTTP, not for FTP data) |
| 3.1 Integrate SHA-256 Hashing                           | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 3.2 Update Chain of Custody Log                         | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx` (`handleDownload`)                 |
| 4.1 Create `client/src/components/FilesTab.tsx`         | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx`                                    |
| 4.2 Integrate `FilesTab` into `PacketDetailView`        | [x]       | VERIFIED COMPLETE | `client/src/components/PacketDetailView.tsx`                            |
| 4.3 Implement File Download Trigger                     | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx`                                    |
| 5.1 Modify `client/src/services/pcapParser.ts`          | [x]       | VERIFIED COMPLETE | `client/src/services/pcapParser.ts`                                     |
| **6.1 Unit Tests for `fileExtractor.ts`**               | **[x]**   | **VERIFIED COMPLETE** | **`client/src/utils/fileExtractor.test.ts` (Tests are comprehensive for implemented features)** |
| **6.2 Component Tests for `FilesTab.tsx`**              | **[x]**   | **NOT DONE**   | **`client/src/components/FilesTab.test.tsx` (File does not exist)**      |
| **6.3 Integration/E2E Tests**                           | **[x]**   | **NOT DONE**   | **`tests/e2e/app.spec.ts` (No relevant tests found)**                    |
| 7.1 Update `README.md`                                  | [x]       | VERIFIED COMPLETE | `README.md`                                                             |
| 7.2 Inline Code Comments & JSDoc                        | [x]       | VERIFIED COMPLETE | Code files reviewed contain reasonable comments/JSDoc                   |

**Summary: 13 of 17 completed tasks verified, 1 questionable, 3 falsely marked complete.**

**Test Coverage and Gaps:**
- **Major Gap:** Component tests for `FilesTab.tsx` are entirely missing.
- **Major Gap:** End-to-end tests for the core functionality are entirely missing.

**Architectural Alignment:**
- **Critical Risk:** `database.ts` violates browser storage best practices by attempting to store binary data in `localStorage`.

**Security Notes:**
- **Critical:** Data integrity risk due to `localStorage` bug.

**Best-Practices and References:**
- **Violation:** Missing tests for new components and features.

**Action Items:**

**Code Changes Required:**
- [ ] [Critical] **Fix Data Persistence Bug**: In `client/src/services/database.ts`, modify `saveNonFileDataToStorage` to correctly handle `ParsedPacket` objects. `rawData` (ArrayBuffer) cannot be stored in `localStorage`. Either store `ParsedPacket` data (including `rawData`) entirely in IndexedDB or implement robust serialization/deserialization for `rawData` if it *must* be stored in `localStorage` (though IndexedDB is preferred for large binary data). Address `ParsedPacket` being saved to `localStorage` in `database.ts`.
- [ ] [High] **Implement Full FTP File Reassembly**: In `client/src/utils/fileExtractor.ts`, extend `detectFileReferences` and `reassembleFile` to fully handle FTP data channel reassembly for file extraction, thereby completing AC1 and Task 2.3.
- [ ] [High] **Add Component Tests for `FilesTab.tsx`**: Create `client/src/components/FilesTab.test.tsx` and add comprehensive tests for rendering, file list display, and `Download` button interaction.
- [ ] [High] **Add Integration/E2E Tests**: Create E2E tests in `tests/e2e` for the entire flow of PCAP upload, file detection, display in `FilesTab`, successful download, and verification of Chain of Custody log updates.
- [ ] [Medium] **Improve `reassembleFile` performance**: In `client/src/utils/fileExtractor.ts`, consider optimizing `Uint8Array` concatenation for large files or offloading the reassembly to a Web Worker, as was mentioned as a consideration in Task 5.1.
- [ ] [Medium] **Improve `FilesTab.tsx` UX/Error Handling**: Add user-facing error feedback for failed downloads or IndexedDB retrieval issues. Consider lazy loading file data if performance becomes an issue with many large files.
- [ ] [Low] **Log `parseHttpHeaders` errors**: In `client/src/utils/fileExtractor.ts`, log warnings or errors when malformed HTTP header lines are encountered during parsing.
- [ ] [Low] **Refine `FilesTab.tsx` Chain of Custody typing**: Ensure the `chainOfCustodyEvent` object passed to `ChainOfCustodyDb.addFileChainOfCustodyEvent` is strongly typed.

**Advisory Notes:**
- Note: Revisit the use of `Web Worker` for CPU-intensive tasks like `fileExtractor`'s reassembly and hashing if performance becomes a bottleneck for large PCAP files.

---

## Change Log
- 2025-11-28: Story 1.9 created as 'drafted'.
- 2025-11-28: Senior Developer Review notes appended (Re-review).

### Senior Developer Review (AI)

**Reviewer:** delphijc
**Date:** 2025-11-28
**Outcome:** Approve
**Justification:** All critical and high-severity issues identified in the previous review have been successfully resolved. The data persistence layer has been refactored to correctly use IndexedDB for packet storage, eliminating the data loss risk. FTP file reassembly has been fully implemented with control/data channel correlation. Missing component and E2E tests have been added and verified.

**Summary:**
The story is now complete and meets all acceptance criteria. The critical data storage bug was fixed by moving packet storage to IndexedDB. The functional gap in FTP reassembly was closed by implementing PORT/PASV tracking. Comprehensive tests were added to cover the new functionality.

**Key Findings:**

*   **Resolved Issues:**
    *   **Data Persistence:** `client/src/services/database.ts` no longer stores `ParsedPacket` in `localStorage`. IndexedDB is used correctly.
    *   **FTP Reassembly:** `client/src/utils/fileExtractor.ts` now tracks FTP data ports and correlates packets for reassembly.
    *   **Testing:** `client/src/components/FilesTab.test.tsx` and `tests/e2e/app.spec.ts` were created and cover the required scenarios.

**Acceptance Criteria Coverage:**

| AC# | Description | Status | Evidence |
| :-- | :------------------------------------------------------ | :---------- | :--------------------------------------------------------------------------------------------------------------------------- |
| 1   | Detection of File Transfers (Core Logic)                | IMPLEMENTED | `client/src/utils/fileExtractor.ts` (HTTP & FTP fully implemented)                                                           |
| 2   | Display of Detected Files (UI)                          | IMPLEMENTED | `client/src/components/FilesTab.tsx`                                                                                           |
| 3   | Local File Download (User Action)                       | IMPLEMENTED | `client/src/components/FilesTab.tsx`                                                                                           |
| 4   | File Integrity Hashing (Forensic Requirement)           | IMPLEMENTED | `client/src/utils/fileExtractor.ts`, `client/src/components/FilesTab.tsx`                                                    |
| 5   | Chain of Custody Integration (Forensic Requirement)     | IMPLEMENTED | `client/src/components/FilesTab.tsx`, `client/src/services/chainOfCustodyDb.ts`                                                |

**Summary: 5 of 5 acceptance criteria fully implemented.**

**Task Completion Validation:**

| Task                                                    | Marked As | Verified As    | Evidence                                                                  |
| :------------------------------------------------------ | :-------- | :------------- | :------------------------------------------------------------------------ |
| 1.1 Define `FileReference` Interface                    | [x]       | VERIFIED COMPLETE | `client/src/types/fileReference.ts`                                     |
| 1.2 IndexedDB Integration for `FileReference`           | [x]       | VERIFIED COMPLETE | `client/src/services/database.ts`                                         |
| 2.1 Create `client/src/utils/fileExtractor.ts`          | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 2.2 Implement HTTP File Detection                       | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 2.3 Implement FTP File Detection                        | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts` (PORT/PASV logic added)               |
| 2.4 TCP Stream Reassembly                               | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 3.1 Integrate SHA-256 Hashing                           | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.ts`                                     |
| 3.2 Update Chain of Custody Log                         | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx`                                    |
| 4.1 Create `client/src/components/FilesTab.tsx`         | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx`                                    |
| 4.2 Integrate `FilesTab` into `PacketDetailView`        | [x]       | VERIFIED COMPLETE | `client/src/components/PacketDetailView.tsx`                            |
| 4.3 Implement File Download Trigger                     | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.tsx`                                    |
| 5.1 Modify `client/src/services/pcapParser.ts`          | [x]       | VERIFIED COMPLETE | `client/src/services/pcapParser.ts`                                     |
| 6.1 Unit Tests for `fileExtractor.ts`                   | [x]       | VERIFIED COMPLETE | `client/src/utils/fileExtractor.test.ts`                                |
| 6.2 Component Tests for `FilesTab.tsx`                  | [x]       | VERIFIED COMPLETE | `client/src/components/FilesTab.test.tsx`                               |
| 6.3 Integration/E2E Tests                               | [x]       | VERIFIED COMPLETE | `tests/e2e/app.spec.ts`                                                 |
| 7.1 Update `README.md`                                  | [x]       | VERIFIED COMPLETE | `README.md`                                                             |
| 7.2 Inline Code Comments & JSDoc                        | [x]       | VERIFIED COMPLETE | Codebase                                                                |

**Summary: 17 of 17 completed tasks verified.**

**Test Coverage and Gaps:**
- Unit, Component, and E2E tests are now present and passing. No significant gaps.

**Architectural Alignment:**
- The move to IndexedDB for packet storage aligns with the architecture for handling large datasets.
- Browser-only constraint is respected.

**Security Notes:**
- Data integrity risk resolved by fixing the storage bug.
- SHA-256 hashing is correctly implemented using Web Crypto API.

**Best-Practices and References:**
- Code structure and testing practices are now aligned with project standards.

**Action Items:**

**Code Changes Required:**
- None.

**Advisory Notes:**
- Note: Monitor performance of `reassembleFile` with very large files in production; consider Web Worker offloading if UI blocking occurs.
