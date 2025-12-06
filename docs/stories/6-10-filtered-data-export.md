# Story 6.10: Filtered Data Export

**Story ID:** 6.10
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Ready for Development

## User Story

As an analyst,
I want to export ONLY the filtered packets (e.g., just HTTP traffic),
So that I can share a relevant subset of the data.

## Acceptance Criteria

### AC 1: Filtering
- [ ] Export (CSV/JSON/PCAP) respects the currently active filters.
- [ ] Option to "Export All" vs "Export Filtered".

## Design & Implementation

### Component Structure
- **`ExportDialog.tsx`**: Modal with radio buttons for scope.

## Dependencies
- Story 6.8, 6.9.
