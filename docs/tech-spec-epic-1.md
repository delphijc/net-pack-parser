# Epic Technical Specification: Foundation & Browser-Only Infrastructure

Date: 2025-11-22
Author: delphijc
Epic ID: 1
Status: Draft

---

## Overview

This document provides the technical specification for Epic 1: Foundation & Browser-Only Infrastructure. The primary goal of this epic is to establish the foundational web application for browser-only PCAP (Packet Capture) analysis. This will enable users to upload and analyze PCAP files directly in their browser, with all processing performed client-side. This approach ensures user privacy as no data is transmitted to a server. This epic covers the core functionalities of file handling, parsing, local storage, and basic data extraction, laying the groundwork for all subsequent analysis features.

## Objectives and Scope

**In-Scope:**
- A React/TypeScript project setup with Vite, Tailwind CSS, and shadcn/ui.
- Local storage management for all analysis data within the browser's localStorage.
- Functionality to import and export analysis data as a JSON file.
- PCAP file uploading via drag-and-drop and a file picker.
- Parsing of `.pcap` and `.pcapng` files in the browser using a JavaScript-based parser.
- Generation of SHA-256 and MD5 hashes for uploaded files to ensure integrity.
- A detailed packet view including a hex dump and ASCII representation.
- Extraction of tokens, strings, and basic protocols from packet payloads.
- Detection and extraction of files referenced in network traffic (e.g., from HTTP).

**Out-of-Scope:**
- Any server-side processing or real-time packet capture.
- User authentication (all access is unauthenticated in browser-only mode).
- Advanced threat detection, performance monitoring, and timeline analysis (these are covered in subsequent epics).

## System Architecture Alignment

This epic aligns perfectly with **Mode 1: Browser-Only (Standalone)** of the hybrid client-server architecture defined in the architecture document. It exclusively utilizes the `client` portion of the monorepo. All components, services, and utilities are part of the React/TypeScript application. Data storage relies on browser APIs (`localStorage`, `IndexedDB`) and all processing is handled by the client's machine, ensuring the privacy-first principle of this mode. The architecture decisions for the frontend (React, Vite, TypeScript, shadcn/ui, TanStack Query, Zustand) directly support the implementation of this epic.

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs/Outputs | Owner |
|---|---|---|---|
| `pcapParser.ts` | Handles parsing of PCAP files. | Input: PCAP file (ArrayBuffer). Output: Array of Packet objects. | TBD |
| `localStorage.ts` | Manages data storage in browser localStorage with quota monitoring. | Input: Key, Value. Output: Stored data. | TBD |
| `hashGenerator.ts` | Generates cryptographic hashes of files. | Input: File data (ArrayBuffer). Output: SHA-256 and MD5 hashes. | TBD |
| `PacketList.tsx` | Displays the list of parsed packets. | Input: Array of Packet objects. | TBD |
| `PacketDetailView.tsx` | Shows detailed information for a selected packet, including hex dump. | Input: Packet object. | TBD |
| `FileUploader.tsx` | Handles file upload via drag-and-drop or file picker. | Output: File object. | TBD |

### Data Models and Contracts

```typescript
// From architecture.md
interface Packet {
  id: string; // UUID
  timestamp: number; // Unix timestamp (ms)
  sourceIP: string; // IPv4 or IPv6
  destIP: string;
  sourcePort: number;
  destPort: number;
  protocol: string; // 'TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS'
  length: number; // Bytes
  rawData: ArrayBuffer; // Packet payload
  flags?: string[]; // TCP flags ['SYN', 'ACK']
  sessionId?: string; // For TCP session grouping
}

interface FileReference {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  sourcePacketId: string;
  data: Blob;
}
```

### APIs and Interfaces

This epic will primarily use browser-native APIs:
- **File API:** For reading user-uploaded files.
- **Web Crypto API:** For generating SHA-256 hashes (`crypto.subtle.digest`).
- **`localStorage` API:** For storing user settings and smaller datasets.
- **`IndexedDB` API:** For storing larger datasets like parsed packets and extracted files.
- **Drag and Drop API:** For the file upload zone.

### Workflows and Sequencing

1.  **File Upload:**
    - User drags a PCAP file onto the application or selects it via a file picker.
    - The `FileUploader.tsx` component captures the file.
2.  **Parsing and Hashing:**
    - The file is passed to a Web Worker to prevent blocking the main thread.
    - Inside the worker, `pcapParser.ts` parses the file, and `hashGenerator.ts` calculates its hashes.
    - Progress is reported back to the main thread.
3.  **Data Storage:**
    - Parsed packets are stored in IndexedDB.
    - File metadata and hashes are stored alongside the packet data.
    - The `localStorage.ts` service manages settings and smaller data.
4.  **Display:**
    - `PacketList.tsx` displays the parsed packets from IndexedDB.
    - When a user clicks a packet, `PacketDetailView.tsx` shows its details.

## Non-Functional Requirements

### Performance

- **NFR-P1:** PCAP files up to 10MB must parse within 5 seconds on modern hardware.
- **NFR-P2:** PCAP files up to 50MB should parse within 30 seconds (with progress indicator).
- **NFR-P6:** Application bundle size must be < 2MB.
- **NFR-P7:** Memory usage must remain < 500MB during a typical analysis session.

### Security

- **NFR-S1:** All browser-side processing must occur client-side. PCAP uploads are never sent to a server in browser-only mode.
- **NFR-S2:** Cryptographic hashes (SHA-256) must use the secure browser Web Crypto API.
- **NFR-S4:** All user inputs must be sanitized to prevent XSS (though user input is minimal in this epic).
- **NFR-S5:** localStorage data must be scoped per-origin.

### Reliability/Availability

- **NFR-R1:** Application must handle malformed PCAP files gracefully with clear error messages and no crashes.
- **NFR-R3:** Browser crashes should not lose in-progress analysis data (periodic auto-save to IndexedDB).
- **NFR-R4:** Application must handle `localStorage` quota exceeded errors gracefully.

### Observability

- **Frontend Logging:**
  - Development: Verbose logging with `console.log`, `console.warn`, `console.error`.
  - Production: Error logging only.
  - Logging will be structured to include context (e.g., file parsing, storage operations).

## Dependencies and Integrations

- **`pcap-decoder`:** For parsing PCAP files in the browser.
- **`crypto-js`:** For MD5 hashing (as Web Crypto API does not support MD5).
- **`react` & `react-dom`:** Core UI library.
- **`vite`:** Build tool.
- **`tailwindcss`:** CSS framework.
- **`shadcn/ui`:** Component library.
- **`zustand`:** For UI state management.
- **`tanstack-query`:** For managing asynchronous operations like file parsing.

## Acceptance Criteria (Authoritative)

**Story 1.1: Project Initialization & Build System**
- A new React + TypeScript + Vite project is created successfully.
- The project includes Tailwind CSS and shadcn/ui configuration.
- The build system compiles successfully with `npm run build`.

**Story 1.2: Local Storage Manager**
- All analysis data is stored in browser `localStorage`.
- The system warns when storage exceeds 80% of the browser limit.
- Users can clear all stored data with confirmation.

**Story 1.3: Data Import/Export Foundation**
- Users can export all analysis data to a JSON file.
- Users can import data from a previously exported JSON file, with validation.

**Story 1.4: PCAP File Upload & Parsing**
- Users can upload PCAP files via drag-and-drop or a file picker.
- The system parses `.pcap` and `.pcapng` files and extracts packet metadata.
- Parsing completes in <5 seconds for a 10MB file.

**Story 1.5: File Hash Generation & Chain of Custody**
- The system generates SHA-256 and MD5 hashes for uploaded files.
- A chain of custody log entry is created for each uploaded file.

**Story 1.6: Packet Detail View with Hex Dump**
- Clicking a packet opens a detailed view with decoded headers.
- The view includes a payload hex dump in a 16-bytes-per-line format with ASCII representation.

**Story 1.7: Token & String Extraction**
- The system automatically extracts IPs, URLs, emails, potential credentials, and printable strings from packet payloads.
- Extracted strings are displayed in a searchable and filterable list.

**Story 1.8: Protocol Detection & Classification**
- Packets are automatically classified by protocol (HTTP, DNS, TCP, etc.) based on port and content.
- Users can filter packets by the detected protocol.

**Story 1.9: File Reference Detection & Download**
- The system detects file transfers within HTTP/FTP traffic.
- Detected files are listed and can be downloaded.

## Traceability Mapping

| Acceptance Criteria (Story) | Spec Section(s) | Component(s)/API(s) | Test Idea |
|---|---|---|---|
| Story 1.1 | 2, 6 | `vite.config.ts` | `npm run build` succeeds |
| Story 1.2 | 2, 4.3 | `localStorage.ts`, `useLocalStorage.ts` | Mock `localStorage` limit and verify warning |
| Story 1.3 | 2, 4.3 | `localStorage.ts` | Export data, modify it, then import and verify changes |
| Story 1.4 | 2, 4.1 | `FileUploader.tsx`, `pcapParser.ts` | Upload a known PCAP and verify packet count |
| Story 1.5 | 2, 4.1 | `hashGenerator.ts`, Web Crypto API | Verify SHA-256 hash of a known file |
| Story 1.6 | 2, 4.1 | `PacketDetailView.tsx` | Verify hex dump format for a specific packet |
| Story 1.7 | 2, 4.1 | `pcapParser.ts` | Verify that a known URL in a payload is extracted |
| Story 1.8 | 2, 4.1 | `pcapParser.ts` | Verify HTTP traffic on port 80 is correctly labeled |
| Story 1.9 | 2, 4.1 | `pcapParser.ts` | Verify a file from an HTTP stream can be reconstructed |

## Risks, Assumptions, Open Questions

- **Risk:** Browser performance limitations when parsing very large (100MB+) PCAP files.
  - **Mitigation:** Use Web Workers to offload parsing from the main UI thread. Implement and test streaming parsing to avoid loading the entire file into memory. Clearly document file size recommendations.
- **Risk:** Inconsistent `localStorage` and `IndexedDB` quota limits across different browsers.
  - **Mitigation:** Implement robust quota-checking and provide clear, user-friendly error messages when limits are approached or exceeded.
- **Assumption:** The `pcap-decoder` library will be performant and accurate enough for our needs.
  - **Mitigation:** Create a proof-of-concept to benchmark the library with various PCAP files before committing to it in the main application.
- **Question:** How should the application behave if a user tries to upload a file that is too large for the browser to handle?
  - **Next Step:** Define a clear upper limit for file sizes and implement a pre-upload check to prevent browser crashes.

## Test Strategy Summary

- **Unit Tests:** `Vitest` will be used to test individual functions, such as BPF filter logic, hash generation, and data formatting utilities. `pcapParser.ts` will have extensive unit tests covering different packet types.
- **Component Tests:** `React Testing Library` will be used to test React components in isolation. This includes testing the `PacketList` rendering, `PacketDetailView` content, and `FileUploader` interactions.
- **E2E Tests:** `Playwright` will be used to test the full user flow for PCAP analysis: uploading a file, seeing the packet list, clicking a packet, and viewing the details.
- **Performance Tests:** Manual performance testing using browser developer tools will be conducted to ensure compliance with NFRs. Automated performance tests can be added later using Playwright.

## Post-Review Follow-ups

- Provide verifiable evidence for the npm run dev functionality (AC #5) (Story 1.1)
- (From Story 1.2) Implement data versioning logic in `localStorage.ts`.
- (From Story 1.2) Update the "Tasks / Subtasks" section in story 1.2 to accurately reflect completion status.
- (Story 1.3) [High] Unskip and fix unit test for `generateExportJson`. Verify AC1 and AC2. [file: `client/src/utils/dataImportExport.test.ts:42`]
- (Story 1.3) [High] Unskip and fix component tests for `SettingsPage`. Verify AC1, AC5, AC6. [file: `client/src/components/SettingsPage.test.tsx:12`]
- (Story 1.3) [Low] Dynamically read `APP_VERSION` from `package.json`. [file: `client/src/utils/dataImportExport.ts:5`]

