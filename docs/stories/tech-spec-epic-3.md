# Epic Technical Specification: Threat Detection & Security Analysis

Date: Sunday, November 30, 2025
Author: delphijc
Epic ID: 3
Status: Draft

---

## Overview

This Epic Technical Specification details the implementation for **Epic 3: Threat Detection & Security Analysis**, which aims to enable automated threat detection with MITRE ATT&CK mapping and IOC matching. The Network Traffic Parser platform's vision is to provide a unified, browser-based solution for real-time performance monitoring and network forensics, addressing the fragmentation of existing tools. This epic specifically tackles the problem of identifying security threats without manual inspection, providing critical capabilities for security analysts and forensic investigators.

## Objectives and Scope

**Objectives:**
- Enable automated detection of various network-borne threats (SQL injection, XSS, command injection, sensitive data exposure).
- Integrate YARA signature scanning for known malware and custom rules.
- Map all detected threats to the MITRE ATT&CK framework for standardized communication and understanding of attack patterns.
- Provide a built-in and extensible IOC database for identifying known malicious indicators.
- Classify threats by severity and allow for alert management (false positives, confirmed threats).

**In-Scope:**
- SQL Injection, XSS, Command Injection, Directory Traversal detection.
- Sensitive Data Exposure detection (credit cards, SSNs, API keys, cleartext passwords).
- YARA signature scanning on packet payloads and extracted files.
- MITRE ATT&CK framework mapping for all threat types.
- Built-in and custom IOC database management (IPs, domains, hashes, URLs).
- Threat severity classification (Critical, High, Medium, Low, Info) and alert management.
- Integration with PCAP file analysis and real-time packet streaming (from future epics).

**Out-of-Scope (for this epic):**
- Real-time packet streaming from server agent (covered in Epic 8).
- Performance monitoring dashboard features (covered in Epic 4).
- Comprehensive forensic timeline reconstruction (covered in Epic 5).
- Multi-user collaboration features.
- Persistent server-side storage of threat alerts (localStorage only for now).

## System Architecture Alignment

The implementation of Epic 3 aligns with the overall **Hybrid Client-Server Architecture** of the Network Traffic Parser. Threat detection logic will primarily reside within the **Web Interface (React/TypeScript)**, leveraging the browser's processing capabilities for PCAP file analysis and real-time streamed packets (from Epic 8). The chosen `yara-js` library (WebAssembly YARA port) is browser-compatible, allowing efficient malware detection without server dependency.

Key components from the overall architecture that Epic 3 interacts with include:
- **PCAP Parser (`pcap-decoder`)**: Provides packet payloads for threat analysis.
- **Web Crypto API**: Used for hash generation of IOCs and for secure operations.
- **WebSocket Streaming (from Epic 8)**: Threat detection will be applied to live streamed packets.
- **Local Storage / IndexedDB**: Used for storing YARA rules, custom IOCs, and detected threat alerts.
- **Styling (Tailwind CSS & shadcn/ui)**: Threat indicators will be visually represented using the "Deep Dive" color theme (Red for Critical, Amber for High/Warning).

All threat detection mechanisms are designed to be client-side first to maintain user privacy in browser-only mode, with future integration for server-side processing as needed.

## Detailed Design

### Services and Modules

The core threat detection logic will be encapsulated within new modules in the `client/src/utils/threatDetection.ts` file, integrating with existing packet parsing services.

-   **`client/src/utils/threatDetection.ts`**:
    -   **Purpose**: Centralized module for all pattern-based threat detection (SQLi, XSS, Command Injection, Directory Traversal, Sensitive Data Exposure). It will expose functions for each detection type.
    -   **Responsibilities**: Implement regex patterns, decoding logic (URL, HTML), and validation algorithms (Luhn for credit cards). Maps detected patterns to threat types and severity.
-   **`client/src/services/iocDatabase.ts`**:
    -   **Purpose**: Manages the built-in and custom IOC database (IPs, domains, hashes, URLs).
    -   **Responsibilities**: Provide fast lookup functions for IOC matching against packet metadata and payloads. Handle IOC import/export (CSV, JSON, STIX).
-   **`client/src/services/yaraEngine.ts`**:
    -   **Purpose**: Interface with the WebAssembly YARA engine (`yara-js`).
    -   **Responsibilities**: Compile YARA rules, scan packet payloads/extracted files, report matches.
-   **`client/src/components/ThreatsPanel.tsx`**:
    -   **Purpose**: UI component to display detected threats, severity, MITRE ATT&CK mappings, and allow alert management.
    -   **Responsibilities**: Render threat list, filter/sort options, false positive/confirmed threat actions.
-   **`client/src/components/MitreAttckViewer.tsx`**:
    -   **Purpose**: UI component to visualize MITRE ATT&CK mappings.
    -   **Responsibilities**: Display ATT&CK tactics distribution, top techniques, and provide drill-down to MITRE knowledge base.
-   **`client/src/types/threat.ts`**:
    -   **Purpose**: TypeScript interfaces for `ThreatAlert` and `IOCEntry` data structures.
    -   **Responsibilities**: Define the shape of threat data throughout the application.

### Data Models and Contracts

**Client-Side Data Models (localStorage / IndexedDB):**

-   **`ThreatAlert`**:
    ```typescript
    interface ThreatAlert {
      id: string; // UUID
      packetId?: string; // Optional: Reference to Packet.id (if associated with a single packet)
      pcapHash?: string; // Optional: Hash of the PCAP file if browser-only mode
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      type: 'sql_injection' | 'xss' | 'command_injection' | 'directory_traversal' | 'sensitive_data' | 'yara_match' | 'ioc_match';
      description: string; // Human-readable description of the threat
      matchedPattern?: string; // The specific pattern/rule that triggered the alert
      matchedValue?: string; // The actual data that matched (redacted if sensitive)
      mitreAttack: string[]; // MITRE ATT&CK Technique IDs (e.g., ['T1190', 'T1059.007'])
      timestamp: number; // Unix timestamp (ms) of the packet or detection
      falsePositive: boolean; // Flag if user marked as FP
      confirmed: boolean; // Flag if user marked as confirmed threat
      packetSummary?: string; // Brief summary of the associated packet
      sourceIp?: string;
      destIp?: string;
      sourcePort?: number;
      destPort?: number;
    }
    ```
-   **`IOCEntry`**:
    ```typescript
    interface IOCEntry {
      id: string; // UUID
      type: 'ip' | 'domain' | 'hash' | 'url';
      value: string; // The IOC value (e.g., "192.0.2.1", "malicious.com", "sha256:abc...")
      description?: string;
      source?: string; // e.g., "AlienVault OTX", "Custom"
      severity?: 'critical' | 'high' | 'medium' | 'low';
      mitreAttack?: string[];
      createdAt: number; // Unix timestamp (ms)
      lastUpdated: number;
      enabled: boolean; // Can be enabled/disabled
    }
    ```
-   **`YARARule`**:
    ```typescript
    interface YARARule {
      id: string; // UUID (hash of the rule content)
      name: string; // Rule name from YARA metadata
      content: string; // Full YARA rule text
      metadata?: { [key: string]: string }; // YARA rule metadata (author, description, MITRE tags)
      enabled: boolean;
      createdAt: number;
    }
    ```

### APIs and Interfaces

**Internal API (Threat Detection Functions - `threatDetection.ts`):**

-   `detectSqlInjection(payload: string): ThreatAlert[]`
-   `detectXss(payload: string): ThreatAlert[]`
-   `detectCommandInjection(payload: string): ThreatAlert[]`
-   `detectDirectoryTraversal(payload: string): ThreatAlert[]`
-   `detectSensitiveData(payload: string): ThreatAlert[]` (Redaction handled at UI level)
-   `mapToMitreAttck(threatType: string): string[]`

**Internal API (IOC Management - `iocDatabase.ts`):**

-   `addCustomIoc(ioc: IOCEntry): Promise<void>`
-   `getIocs(type?: 'ip' | 'domain' | 'hash' | 'url'): Promise<IOCEntry[]>`
-   `searchIocs(packet: Packet): Promise<IOCEntry[]>`
-   `importIocList(format: 'csv' | 'json' | 'stix', data: string): Promise<void>`

**Internal API (YARA Engine - `yaraEngine.ts`):**

-   `compileRules(rules: YARARule[]): Promise<YARACompiler>`
-   `scanPayload(compiler: YARACompiler, payload: ArrayBuffer): Promise<YARAMatch[]>`
-   `scanFile(compiler: YARACompiler, fileContent: ArrayBuffer): Promise<YARAMatch[]>`

### Workflows and Sequencing

1.  **Packet Ingestion**: Packets arrive from PCAP file parsing (Epic 1) or real-time streaming (Epic 8).
2.  **Threat Analysis Pipeline**:
    *   Each packet payload is passed through `threatDetection.ts` functions for pattern-based detection.
    *   Packet metadata (IPs, domains) is checked against `iocDatabase.ts` for IOC matches.
    *   Packet payload is scanned by `yaraEngine.ts` (if YARA rules are active).
3.  **Threat Alert Generation**: If any detection engine flags a threat, a `ThreatAlert` object is created.
    *   Severity is assigned based on threat type and detection engine (configurable).
    *   MITRE ATT&CK mappings are added using `mapToMitreAttck`.
4.  **Threat Storage**: `ThreatAlert` objects are stored locally (localStorage/IndexedDB).
5.  **UI Display**: `ThreatsPanel.tsx` updates to show new alerts. `MitreAttckViewer.tsx` updates dashboards.
6.  **Alert Management**: User can interact with alerts (mark FP/Confirmed, add notes).
7.  **IOC/YARA Rule Management**: User can manage IOCs and YARA rules via dedicated UI.

### Performance

-   **NFR-P3 (Search Queries)**: Threat detection scans across 10,000 packets must return results within 10 seconds.
-   **NFR-P1 (PCAP Parsing)**: Automated threat detection should integrate seamlessly with PCAP parsing, aiming for minimal overhead on the 5-second parsing target for 10MB PCAPs.
-   **YARA Scanning**: YARA signature scans on packet payloads should complete within 10 seconds for 1000 packets.
-   **Real-time Streaming**: Threat detection on live streamed packets (from Epic 8) must not introduce noticeable latency above the NFR-SP1 target of < 500ms from capture to browser display.

### Security

-   **NFR-S1 (Client-Side Processing)**: All threat detection and IOC matching in browser-only mode must occur entirely client-side, with zero data transmission to any server.
-   **NFR-S2 (Crypto API)**: Cryptographic hashes for chain of custody, file integrity (e.g., for YARA rules, IOC imports), and sensitive data detection must use the secure Web Crypto API.
-   **NFR-S4 (Input Sanitization)**: All user inputs for YARA rules, custom IOCs, or BPF filters must be sanitized to prevent XSS or other injection attacks within the application.
-   **NFR-S6 (Clearable Data)**: Sensitive threat detection data (IOCs, YARA rules, threat alerts) must be clearable on demand by the user.
-   **NFR-S8 (WSS/TLS)**: When integrated with the server agent (Epic 8), all WebSocket communication for live threat detection must use WSS (WebSocket Secure) with TLS 1.3.
-   **NFR-S14 (Privilege)**: The Capture Agent (from Epic 7) should run with minimum required privileges when capturing packets, to reduce the attack surface for threat detection.

### Reliability/Availability

-   **NFR-R1 (Malformed PCAP)**: Threat detection engines must handle malformed packet payloads or corrupted PCAP files gracefully, logging errors but not crashing the application.
-   **NFR-R3 (Browser Crashes)**: In-progress threat analysis results (e.g., current scan status, IOC matches) should be periodically auto-saved to avoid data loss due to browser crashes.
-   **NFR-R6 (Error Boundaries)**: Threat detection components must implement error boundaries to prevent a single detection failure from cascading and breaking the entire analysis view.
-   **NFR-SC5 (Responsiveness)**: The application must remain responsive and perform threat detection efficiently with 50,000+ stored packets or active YARA rules.

### Observability

-   **Threat Logging**: All detected threats (Critical, High, Medium) must be logged locally to the browser console for debugging purposes, and optionally to a local IndexedDB for persistent audit trails.
-   **Alert Metrics**: The system should expose metrics on the number of threats detected per category, false positive rates, and confirmed threat rates (e.g., via a local `PerformanceObserver` or custom event system).
-   **YARA Rule Usage**: Track activation status and scan performance of individual YARA rules.
-   **IOC Database Status**: Monitor the size and update frequency of the built-in and custom IOC databases.

## Dependencies and Integrations

## Dependencies and Integrations

**Internal Dependencies:**

-   **`client/src/utils/pcapParser.ts`**: Provides the parsed packet payloads and metadata upon which all threat detection engines operate.
-   **`client/src/utils/hashGenerator.ts`**: Used for hashing IOCs (file hashes) and for sensitive data detection (e.g., private keys).
-   **`client/src/services/localStorage.ts` / IndexedDB**: For persistent storage of YARA rules, custom IOCs, and detected `ThreatAlert` objects.
-   **`client/src/components/PacketList.tsx`**: Threats are linked to specific packets, requiring interaction with the main packet display.
-   **`client/src/types/packet.ts`**: Core data structure for packet representation, essential for all analysis.

**External Libraries (Client-Side):**

-   **`yara-js`**: WebAssembly YARA port for browser-based YARA signature scanning.
-   **`Web Crypto API`**: Browser-native API for cryptographic operations (SHA-256, MD5) for IOCs and sensitive data detection.
-   **`mitre-attack-client` (TBD/Custom)**: A potential future lightweight client-side library or local data structure for MITRE ATT&CK framework data, used for mapping and visualization.

**Integration with Future Epics:**

-   **Epic 1 (Foundation)**: Relies on PCAP file upload and parsing (`pcapParser.ts`) to provide initial data.
-   **Epic 8 (Real-Time Streaming & Live Analysis)**: Threat detection logic will be integrated into the real-time WebSocket packet processing pipeline for live threat analysis.
-   **Epic 5 (Forensic Investigation & Timeline Analysis)**: Detected threats will be integrated into the chronological timeline and event correlation features.

**Data Sources / Third-Party Feeds:**

-   **Curated IOC Feeds**: Initial built-in IOCs will be sourced from reputable open-source threat intelligence feeds (e.g., Abuse.ch, AlienVault OTX, PhishTank) to be integrated at build time or via a dynamic update mechanism (TBD).
-   **MITRE ATT&CK Framework**: The mapping data (JSON format) will be a static asset within the client application, updated periodically with new framework versions.

## Acceptance Criteria (Authoritative)

## Acceptance Criteria (Authoritative)

The following acceptance criteria are derived directly from the Functional Requirements (FRs) for Epic 3 in the Product Requirements Document (PRD).

**FR33: System automatically scans packets for SQL injection patterns**
1.  **Given** an HTTP packet payload contains common SQL injection patterns (e.g., `' OR '1'='1`, `'union select`).
    **When** the system analyzes the packet.
    **Then** a `ThreatAlert` of type "SQL Injection" and severity "CRITICAL" is generated.
    **And** the detected pattern is highlighted in the packet payload view.

**FR34: System automatically scans packets for XSS (Cross-Site Scripting) patterns**
1.  **Given** an HTTP packet payload contains common XSS patterns (e.g., `<script>alert(1)</script>`, `javascript:`).
    **When** the system analyzes the packet.
    **Then** a `ThreatAlert` of type "Cross-Site Scripting (XSS)" and severity "HIGH" is generated.
    **And** the detected pattern is highlighted in the packet payload view.

**FR35: System automatically scans packets for command injection patterns**
1.  **Given** an HTTP packet payload contains common command injection patterns (e.g., `; ls`, `| whoami`, `&& cat /etc/passwd`).
    **When** the system analyzes the packet.
    **Then** a `ThreatAlert` of type "Command Injection" and severity "CRITICAL" is generated.
    **And** the detected pattern is highlighted in the packet payload view.

**FR36: System automatically scans packets for directory traversal attempts**
1.  **Given** an HTTP packet payload contains common directory traversal patterns (e.g., `../`, `..\\`, `%2e%2e%2f`).
    **When** the system analyzes the packet.
    **Then** a `ThreatAlert` of type "Directory Traversal" and severity "HIGH" is generated.
    **And** the detected pattern is highlighted in the packet payload view.

**FR37: System automatically scans packets for sensitive data exposure (credit cards, SSNs, API keys)**
1.  **Given** a packet payload contains a valid credit card number (Luhn algorithm) or SSN pattern.
    **When** the system analyzes the packet.
    **Then** a `ThreatAlert` of type "Sensitive Data Exposure" and severity "CRITICAL" is generated.
    **And** the detected sensitive data is redacted in the UI (e.g., show only last 4 digits).

**FR38: Users can run YARA signature scans on packet payloads**
1.  **Given** a user has uploaded a valid YARA rule (`.yar` file) and enabled it.
    **When** the system scans packet payloads against the compiled YARA rules.
    **Then** `ThreatAlert`s of type "YARA Match" are generated for matching packets.
    **And** the matched rule name and strings are displayed in the alert details.

**FR39: System maps detected threats to MITRE ATT&CK tactics and techniques**
1.  **Given** a `ThreatAlert` is generated for any detected threat (SQLi, XSS, Command Injection, etc.).
    **When** the threat is displayed in the UI.
    **Then** the corresponding MITRE ATT&CK tactic(s) and technique(s) (e.g., T1190, T1059.007) are displayed.
    **And** clicking on the technique ID provides a link to the MITRE ATT&CK knowledge base.

**FR40: Users can view threat severity levels (critical, high, medium, low, info)**
1.  **Given** `ThreatAlert`s are displayed in the Threats panel.
    **When** the user views the panel.
    **Then** each `ThreatAlert` prominently displays a color-coded severity badge (Red for Critical, Orange for High, etc., as per UX Design).

**FR41: System generates alerts for detected threats**
1.  **Given** a `ThreatAlert` is generated.
    **When** the system detects the threat.
    **Then** a visual and audible notification alert is presented to the user.
    **And** the alert can be dismissed by the user.

**FR42: Users can mark alerts as false positives or confirmed threats**
1.  **Given** a `ThreatAlert` is displayed.
    **When** the user marks the alert as "False Positive".
    **Then** the alert is moved to a "False Positives" log and hidden from the main view.
2.  **Given** a `ThreatAlert` is displayed.
    **When** the user marks the alert as "Confirmed Threat".
    **Then** the alert is flagged for follow-up and remains visible in a "Confirmed Threats" filter.

**FR43: System includes built-in IOC (Indicator of Compromise) database**
1.  **Given** the application starts.
    **When** the IOC database is initialized.
    **Then** it contains a curated set of built-in IOCs (malicious IPs, domains, hashes) from reputable open-source feeds.

**FR44: Users can search packets for known IOCs (malicious IPs, domains, file hashes)**
1.  **Given** packets are loaded and the IOC database is populated.
    **When** the system analyzes the packets.
    **Then** it automatically checks packet metadata (IPs, domains) and payloads (file hashes) against known IOCs.
    **And** `ThreatAlert`s of type "Known IOC Match" and severity "HIGH" or "CRITICAL" are generated for matches.

**FR45: Users can add custom IOCs to the database**
1.  **Given** the user navigates to the IOC Management section.
    **When** the user provides a custom IOC (IP, domain, hash, or URL) with type and optional description.
    **Then** the custom IOC is added to the local IOC database and immediately used for scanning.

**FR46: Users can import IOC lists (CSV, JSON, STIX formats)**
1.  **Given** the user provides an IOC list file (CSV, JSON, or STIX format).
    **When** the system processes the import.
    **Then** all valid IOCs from the file are added to the local IOC database.
    **And** the user is notified of the number of IOCs imported and any errors.

**FR47: System highlights packets matching known IOCs**
1.  **Given** an IOC match is detected in a packet.
    **When** the packet is displayed in the packet list or details view.
    **Then** the matching IOC (IP, domain, hash, or URL) is visually highlighted (e.g., with a red underline).

**FR48: Users can export matched IOCs for sharing**
1.  **Given** IOC matches have been detected or custom IOCs have been added.
    **When** the user requests to export matched IOCs.
    **Then** a file (CSV or JSON format) is downloaded containing the exported IOCs and their metadata.

## Traceability Mapping

| Functional Requirement | Acceptance Criteria IDs | Epic 3 Component(s) Involved                                   | Architecture Component(s) Referenced                         | Test Idea (Level)                                                      |
| :--------------------- | :---------------------- | :------------------------------------------------------------- | :----------------------------------------------------------- | :--------------------------------------------------------------------- |
| FR33 (SQL Injection)   | AC33.1                  | `threatDetection.ts`                                           | Frontend Logic                                               | Unit/Component: `threatDetection.test.ts` (SQLi patterns)      |
| FR34 (XSS)             | AC34.1                  | `threatDetection.ts`                                           | Frontend Logic                                               | Unit/Component: `threatDetection.test.ts` (XSS patterns)       |
| FR35 (Command Injection)| AC35.1                  | `threatDetection.ts`                                           | Frontend Logic                                               | Unit/Component: `threatDetection.test.ts` (Command/Dir Trav) |
| FR36 (Dir Traversal)   | AC36.1                  | `threatDetection.ts`                                           | Frontend Logic                                               | Unit/Component: `threatDetection.test.ts` (Command/Dir Trav) |
| FR37 (Sensitive Data)  | AC37.1                  | `threatDetection.ts`                                           | Frontend Logic                                               | Unit/Component: `threatDetection.test.ts` (Sensitive data)   |
| FR38 (YARA Scan)       | AC38.1                  | `yaraEngine.ts`, `ThreatsPanel.tsx`                            | Frontend Logic, `yara-js` (WebAssembly)                      | E2E/Component: YARA rule upload & scan                       |
| FR39 (MITRE ATT&CK)    | AC39.1                  | `MitreAttckViewer.tsx`, `ThreatAlert` model                    | Frontend Logic, External MITRE data                          | Unit/Component: `MitreAttckViewer.test.ts`                   |
| FR40 (Severity View)   | AC40.1                  | `ThreatsPanel.tsx`, `ThreatAlert` model                        | Frontend UI, UX Design Semantic Colors                       | Component: `ThreatsPanel.test.tsx` (Severity display)      |
| FR41 (Alerts)          | AC41.1                  | `ThreatsPanel.tsx`, Notification System (TBD)                  | Frontend UI                                                  | E2E/Component: Threat alert notification                     |
| FR42 (Mark FP/Confirm) | AC42.1, AC42.2          | `ThreatsPanel.tsx`, `ThreatAlert` model                        | Frontend UI, Persistent Storage                              | Component: `ThreatsPanel.test.tsx` (Alert actions)         |
| FR43 (Built-in IOC)    | AC43.1                  | `iocDatabase.ts`                                               | Frontend Logic, External IOC feeds (build-time)              | Unit: `iocDatabase.test.ts` (Initialization)                 |
| FR44 (Search IOCs)     | AC44.1                  | `iocDatabase.ts`                                               | Frontend Logic                                               | Unit/Component: `iocDatabase.test.ts` (Matching)             |
| FR45 (Custom IOCs)     | AC45.1                  | `iocDatabase.ts`, `IOCManagementPanel.tsx` (TBD)               | Frontend UI, Persistent Storage                              | E2E/Component: Custom IOC add                                |
| FR46 (Import IOCs)     | AC46.1                  | `iocDatabase.ts`, `IOCManagementPanel.tsx` (TBD)               | Frontend UI, File Parsing                                    | E2E/Component: IOC list import                               |
| FR47 (Highlight IOCs)  | AC47.1                  | `PacketList.tsx`, `PacketDetailView.tsx`                       | Frontend UI, Styling                                         | E2E/Component: IOC highlighting in views                     |
| FR48 (Export IOCs)     | AC48.1                  | `iocDatabase.ts`, `IOCManagementPanel.tsx` (TBD), Export Utility | Frontend Logic, File Download                                | E2E/Component: IOC list export                               |

## Risks, Assumptions, Open Questions

## Risks, Assumptions, Open Questions

### Risks

1.  **Client-Side Performance Overhead**: Performing comprehensive threat detection (SQLi, XSS, YARA, IOC) directly in the browser on large PCAP files or high-volume live streams could impact UI responsiveness (NFR-P1, NFR-P3).
    *   **Mitigation**: Utilize Web Workers for CPU-intensive tasks (YARA, deep packet inspection). Optimize regex patterns and IOC lookup algorithms for performance. Implement virtualization for large packet lists.
2.  **False Positives**: Overly aggressive detection patterns could lead to a high rate of false positives, desensitizing users to real threats (NFR-P).
    *   **Mitigation**: Implement robust pattern tuning, leverage confidence scoring, allow user feedback for false positives (FR42), and regularly update detection rules.
3.  **Evasion Techniques**: Sophisticated attackers may use novel encoding, encryption, or obfuscation techniques to bypass pattern-based detection (NFR-S).
    *   **Mitigation**: Continuously research new evasion techniques, integrate community-sourced YARA rules, provide options for custom pattern definition.
4.  **Browser Security Model Limitations**: Browser's sandboxed environment may limit access to certain low-level packet data or system resources needed for advanced analysis.
    *   **Mitigation**: Clearly document browser-only limitations. Leverage server-side agent (Epic 7) for advanced capabilities where browser is insufficient.
5.  **YARA Rules Management**: Managing a large number of YARA rules in the browser (compilation, updates) could be complex and performance-intensive (FR38).
    *   **Mitigation**: Implement efficient rule compilation caching and incremental updates. Prioritize rule sets to scan only relevant packets.

### Assumptions

1.  **WebAssembly Performance**: It is assumed that the `yara-js` WebAssembly engine will provide sufficient performance for YARA rule compilation and scanning within the browser context.
2.  **Browser API Access**: Assumed that Web Crypto API, Web Workers, and IndexedDB will be sufficiently performant and broadly available across target browsers (NFR-BC1, NFR-BC4).
3.  **Threat Intelligence Updates**: Built-in IOC database will be periodically updated via a defined mechanism (TBD - future epic or manual update).
4.  **Packet Data Structure**: The `Packet` data model from Epic 1 will be sufficient to carry all necessary metadata and raw payload for threat detection.

### Open Questions

1.  What is the strategy for updating and distributing built-in IOCs and YARA rule sets? (Manual, automated feed, community-driven?)
2.  How will sensitive data redaction (FR37) be handled for exported reports or shared analysis?
3.  What level of user customization will be allowed for detection rules beyond YARA? (e.g., custom regex patterns for sensitive data).

## Test Strategy Summary

The testing strategy for Epic 3 will focus on ensuring high accuracy of threat detection, robust handling of various packet payloads, and seamless integration with the application's UI.

**Test Levels:**
1.  **Unit Tests (`Vitest`)**: For individual threat detection functions (`threatDetection.ts`, `iocDatabase.ts` matching logic, YARA rule compilation/matching in isolation).
2.  **Component Tests (`React Testing Library`)**: For `ThreatsPanel.tsx`, `MitreAttckViewer.tsx`, and IOC/YARA management UI components, ensuring correct rendering and user interaction.
3.  **E2E Tests (`Playwright`)**: For critical end-to-end flows involving threat detection:
    *   Upload PCAP with known threats → Verify threat alerts are generated correctly.
    *   Live stream with simulated attacks (from Epic 8) → Verify real-time alerts.
    *   User marking alerts as false positive/confirmed.
    *   Importing/exporting IOCs.

**Key Test Areas:**
-   **Pattern Matching Accuracy**: Extensive test cases for each threat type (SQLi, XSS, Command Injection, Dir Traversal, Sensitive Data) covering common patterns, encoded variations, and edge cases.
-   **False Positive Testing**: Test with legitimate traffic that resembles threats to minimize false positives.
-   **Performance Testing**: Measure performance of detection engines with large PCAP files and high packet rates (NFR-P1, NFR-P3, YARA scanning NFR).
-   **Security Testing**: Ensure sensitive data redaction functions correctly and full data is not inadvertently exposed.
-   **MITRE ATT&CK Mapping**: Verify correct mapping for each threat type.
-   **IOC Database Functionality**: Test custom IOC addition, import/export, and matching.
-   **YARA Engine Stability**: Test YARA rule compilation and scanning with various rule complexities and payloads.

**Coverage Targets:**
-   **Threat Detection Logic**: ≥90% unit test coverage.
-   **UI Components**: ≥80% component test coverage for critical interactions.
-   **E2E Flows**: 100% E2E coverage for all P0 (Critical) threat detection scenarios.

## Development Environment
