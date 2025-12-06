# Story 1.10: Smart Packet List Views

**Epic:** 1: Foundation & Browser-Only Infrastructure  
**Story ID:** 1.10  
**Status:** drafted  
**Priority:** Medium  

## User Story

As a security analyst,
I want to filter out noise by defaulting to threats or viewing aggregated flows,
So that I can focus on relevant information in large capture files.

## Acceptance Criteria

### default-threat-view
- [ ] **Given** I have loaded a PCAP file with detected threats
- [ ] **When** I view the packet list
- [ ] **Then** I see a toggle "Show Threats Only"
- [ ] **And** if I enable it, only packets containing threats are displayed
- [ ] **And** I can set this preferences as default in "Settings" -> "Analysis Preferences" -> "Default View: Threats Only"

### tcp-flow-view
- [ ] **Given** I have loaded a PCAP file (especially a large one)
- [ ] **When** I switch the view mode to "Flow View" (e.g. from a dropdown: "Packet View" / "Flow View")
- [ ] **Then** the list displays aggregated conversation flows instead of individual packets
- [ ] **And** each row represents a unique 5-tuple flow (Src IP, Dst IP, Src Port, Dst Port, Protocol)
- [ ] **And** the columns display:
    - Flow Start Time
    - Duration
    - Source (IP:Port)
    - Destination (IP:Port)
    - Protocol
    - Packets (count)
    - Bytes (total size)
    - Info (Text preview of payload, if applicable)
- [ ] **And** I can sort by any column (e.g. largest flows, longest duration)

### flow-interaction
- [ ] **Given** I am in "Flow View"
- [ ] **When** I click on a flow row
- [ ] **Then** it expands (or opens a detailed view) showing the constituent packets
- [ ] **And** I can see the reassembled stream content (ASCII/Hex) similar to "Follow TCP Stream"

### performance-suggestion
- [ ] **Given** I open a PCAP file with > 10,000 packets
- [ ] **Then** the system shows a toast suggestion: "Large file detected. Switch to Flow View for better performance?"

## Technical Implementation

### Components
- **PacketList**: Add "View Mode" selector (Packets vs Flows).
- **FlowList**: New component to render aggregated flows.
- **FlowDetail**: Component to show flow details/reassembly.

### Logic
- **Flow Aggregation**: iterate through packets and group by key `${srcIP}:${srcPort}-${dstIP}:${dstPort}-${proto}`.
    - Handle bidirectional flows? (Usually flows are 5-tuple one way, but "conversation" implies bidirectional. A session key typically sorts IP/Port pairs to handle both directions: `minIp:minPort-maxIp:maxPort`).
    - *Decision*: Group bidirectional conversations if possible for "TCP Flow" view.
- **Performance**: Use a Web Worker for aggregation if > 10k packets.

### State
- **ViewPreference**: Persist `defaultPacketView` ('all' | 'threats' | 'flows') in `localStorage`.

## Design
- **Toggle**: Segmented control or dropdown in the Packet List toolbar.
- **Flow Table**: Similar style to Packet List but with flow metrics.
