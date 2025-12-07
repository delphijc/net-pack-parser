# Story 5.3: Event Correlation Engine

**Story ID:** 5.3
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Done

## User Story

As an analyst,
I want related packets (like a TCP session) to be automatically grouped,
So that I can follow a specific conversation without manual filtering.

## Acceptance Criteria

### AC 1: Flow Identification
- [ ] System identifies TCP/UDP flows based on 5-tuple (Src IP, Src Port, Dst IP, Dst Port, Protocol).
- [ ] Packets are assigned a unique `flowId`.

### AC 2: Visual Grouping
- [ ] In the Packet List, clicking a packet highlights all other packets in the same flow.
- [ ] (Optional) A "Follow Stream" option filters the view to that single flow.

### AC 3: Connection Tracking
- [ ] System flags SYN, SYN-ACK, ACK, FIN sequences to identify session start/end.

## Design & Implementation

### Component Structure
- **`TransformationService.ts`**: Update packet parsing logic (or post-processing) to assign Flow IDs.
- **`PacketList.tsx`**: Update selection logic to highlight same-flow packets.

### Data Model
- Add `flowId` (string hash of 5-tuple) to `Packet` interface.

## Dependencies
## Tasks/Subtasks
- [x] Refine Data Model
    - [x] Update `ParsedPacket` interface in `client/src/types/index.ts` to include optional `flowId`.
    - [x] Update `Packet` interface if necessary (or just ParsedPacket).
- [x] Implement Flow Identification Logic
    - [x] Create `generateFlowId(packet)` utility function (likely in `client/src/utils/pcapUtils.ts` or new `flowUtils.ts`).
    - [x] Logic: 5-tuple hash (SrcIP, SrcPort, DstIP, DstPort, Proto). Sort IPs/Ports to ensure bidirectional flow has same ID.
- [x] Integrate Flow ID into Packet Parsing
    - [x] Update `pcapParser.ts` or `pcapUtils.ts` to calculate and assign `flowId` during parsing/processing.
- [x] Update Packet List UI
    - [x] Highlight packets with same `flowId` on selection.
    - [x] Add "Follow TCP/UDP Stream" context menu or button (filters list by `flowId`).
- [x] Verification
    - [x] Verify `flowId` generation for bidirectional traffic.
    - [x] Verify UI highlighting.

## Review Follow-ups (AI)
- [x] [AI-Review] Implement AC 3: Parse TCP flags in `pcapParser.ts`.

## Dev Notes
- **Flow ID Generation**: `flowId = ${sorted(srcIP, dstIP)}-${sorted(srcPort, dstPort)}-${proto}`.
- **Performance**: Determine if we calculate `flowId` for *every* packet. Yes, it's cheap string manipulation.
- **UI Highlighting**: In `PacketList`, when a row is selected (`selectedPacketId`), find its `flowId` and highlight other rows with matching `flowId`.

## Dev Agent Record
### Implementation Plan
- **Data**: value `flowId: string` on `ParsedPacket`.
- **Logic**: New util `getFlowId(packet)`.
- **UI**: `PacketList.tsx` uses `selectedPacket.flowId` to style rows.

### Debug Log
- 

### Completion Notes
- 

## File List
- client/src/types/index.ts
- client/src/types/packet.ts
- client/src/utils/flowUtils.ts
- client/src/services/pcapParser.ts
- client/src/components/PacketList.tsx
- client/src/components/FlowList.tsx

## Senior Developer Review (AI)
- **Date:** 2025-12-07
- **Outcome:** Approved
- **Summary:** Core flow identification and UI highlighting are implemented well. AC 3 (Connection Tracking) was missing but has been implemented and verified. TCP flags are now parsed.

### Action Items
- [x] [High] Implement AC 3: Parse TCP flags (SYN, ACK, FIN, RST) in `pcapParser.ts` and ensure they are populated in the `Packet` object.
- [ ] [Medium] Update `Packet` interface documentation if needed.


## Change Log
- 
