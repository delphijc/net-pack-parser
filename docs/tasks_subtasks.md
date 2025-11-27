#### 1. Data Model Enhancement (0.5 days)

*   [ ] **1.1. Update `Packet` Interface:**
    *   Modify `client/src/types/packet.ts` to include a `detectedProtocols: string[]` field to store a list of detected protocols (e.g., ["TCP", "HTTP"]).
    *   Consider adding `portBasedProtocol: string` and `deepInspectionProtocol: string` for more granular control if required by further analysis.

#### 2. Protocol Detection Logic Development (2.5 days)

*   [ ] **2.1. Create `client/src/utils/protocolDetector.ts`:**
    *   Develop a core function `detectProtocols(packet: Packet, payload: Uint8Array)` that returns `string[]`.
*   [ ] **2.2. Implement Port-Based Heuristics:**
    *   Add logic to identify common protocols based on source and destination port numbers (e.g., HTTP on 80/8080, HTTPS on 443, DNS on 53, FTP on 20/21, SSH on 22, Telnet on 23, SMTP on 25, POP3 on 110, IMAP on 143, RDP on 3389).
*   [ ] **2.3. Implement IP Header Protocol Field Detection:**
    *   Extract protocol from the IP header (e.g., 6 for TCP, 17 for UDP, 1 for ICMP).
*   [ ] **2.4. Implement Basic Deep Packet Inspection (DPI) for HTTP:**
    *   Examine the start of the payload for "GET ", "POST ", "HTTP/1.1", etc., to confirm HTTP traffic, especially on non-standard ports.
*   [ ] **2.5. Implement Basic DPI for DNS:**
    *   Identify DNS query/response patterns in UDP packets on port 53.
*   [ ] **2.6. Handle Uncertain Detection:**
    *   If no specific protocol is confidently detected, classify as "Unknown" or combine with port number (e.g., "Unknown (Port 12345)").

#### 3. Integration with PCAP Parsing & Data Persistence (1 day)

*   [ ] **3.1. Modify `client/src/services/pcapParser.ts`:**
    *   After initial parsing, pass each `Packet` object and its `rawData` to `protocolDetector.ts`.
    *   Store the returned `detectedProtocols` array in the `Packet` object before persisting to IndexedDB.

#### 4. UI Component: Protocol Filter & Display (2 days)

*   [ ] **4.1. Create a Protocol Filter Component:**
    *   Develop a React component (e.g., `client/src/components/ProtocolFilter.tsx`) with a dropdown or checkboxes to allow users to select protocols for filtering.
    *   This component will need to obtain the list of unique detected protocols from the loaded packets.
*   [ ] **4.2. Integrate Protocol Filter into Main UI:**
    *   Add `ProtocolFilter.tsx` to the `PCAPAnalysisPage.tsx` or a relevant parent component to allow filtering of the `PacketList`.
*   [ ] **4.3. Update `PacketList` Display:**
    *   Modify `PacketList.tsx` to display the `detectedProtocols` for each packet, possibly as badges or a column.
*   [ ] **4.4. Create Protocol Distribution Chart Component:**
    *   Develop a React component (e.g., `client/src/components/ProtocolDistributionChart.tsx`) using Recharts to display a pie or bar chart showing the breakdown of detected protocols.
    *   Integrate this chart into the main analysis dashboard.

#### 5. Testing (2 days)

*   [ ] **5.1. Unit Tests for `client/src/utils/protocolDetector.ts`:**
    *   Write tests for `detectProtocols` covering various scenarios:
        *   Standard HTTP/HTTPS/DNS/FTP/SSH traffic (port-based).
        *   TCP/UDP/ICMP traffic (IP header field).
        *   HTTP/DNS deep packet inspection on non-standard ports.
        *   Malicious or ambiguous packets to ensure "Unknown" classification.
        *   Edge cases (empty payload, very short packets).
*   [ ] **5.2. Component Tests for `ProtocolFilter.tsx`:**
    *   Test rendering with different sets of available protocols.
    *   Test filter selection and event emission.
*   [ ] **5.3. Integration Tests:**
    *   Verify that `pcapParser.ts` correctly calls `protocolDetector.ts` and stores the results.
    *   Test the end-to-end flow of uploading a PCAP, seeing protocol labels in the packet list, and filtering by protocol.
    *   Verify the `ProtocolDistributionChart` accurately reflects the detected protocols.

#### 6. Documentation (0.5 days)

*   [ ] **6.1. Update `README.md` (if necessary):** Add a brief mention of the new protocol detection feature.
*   [ ] **6.2. Inline Code Comments:** Add comments for complex logic in `protocolDetector.ts`.