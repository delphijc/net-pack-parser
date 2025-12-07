# Story 6.8: CSV Export for Packets & Threats

**Story ID:** 6.8
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Done

## User Story

As an analyst,
I want to export packet data and threat lists to CSV,
So that I can import them into Excel or other legacy analysis tools.

## Acceptance Criteria

### AC 1: Export Packets
- [x] Users can download `packets.csv` containing columns for Time, Source IP, Dst IP, Protocol, Length, Info.

### AC 2: Export Threats
- [x] Users can download `threats.csv` containing columns for Packet ID, Threat Type, Severity, Description.

## Design & Implementation

### Component Structure
- **`ExportDropdown.tsx`**: Menu item "Export as CSV".
- **`CsvFormatter.ts`**: Service to map JSON objects to CSV rows.

## Dependencies
- Epic 1.
