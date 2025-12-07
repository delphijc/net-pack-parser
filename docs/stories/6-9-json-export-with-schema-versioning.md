# Story 6.9: JSON Export with Schema Versioning

**Story ID:** 6.9
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Done

## User Story

As an engineer,
I want to export the parsed data as JSON,
So that I can programmatically process it in other scripts.

## Acceptance Criteria

### AC 1: JSON Output
- [x] Export file includes valid JSON array of packet objects.

### AC 2: Schema Version
- [x] The export includes a header or metadata field specifying schema version (e.g., `version: "1.0"`).

## Design & Implementation

### Component Structure
- **`JsonExporter.ts`**.

## Dependencies
- Epic 1.
