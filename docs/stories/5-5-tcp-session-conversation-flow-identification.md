# Story 5.5: TCP Session Conversation Flow Identification

**Story ID:** 5.5
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As an analyst,
I want to reconstruct the full text or payload of a TCP conversation,
So that I can read the exchange (e.g., HTTP request/response) as a cohesive document.

## Acceptance Criteria

### AC 1: Follow Stream View
- [ ] Context menu on a packet -> "Follow TCP Stream".
- [ ] Opens a modal or new view showing the reconstructed payload of the entire session.

### AC 2: Payload Reconstruction
- [ ] System reorders TCP segments by sequence number.
- [ ] System handles missing segments (displays [Missing Data]).
- [ ] Client -> Server data is colored differently from Server -> Client.

### AC 3: Content Support
- [ ] View supports text (ASCII) and Hex dump formats.

## Design & Implementation

### Component Structure
- **`StreamFollower.tsx`**: Modal component.
- **`TcpReassembler.ts`**: Utility to reorder and merge payloads.

## Dependencies
- Story 5.3 (Event Correlation - grouping).
