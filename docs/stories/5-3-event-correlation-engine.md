# Story 5.3: Event Correlation Engine

**Story ID:** 5.3
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

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
- Epic 1 (Packet Parsing).
