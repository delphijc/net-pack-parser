# Story 6.5: Chart Export as Images (PNG/SVG)

**Story ID:** 6.5
**Epic:** 6 (Visualization, Reporting & Export)
**Status:** Done

## User Story

As an analyst,
I want to copy or download charts as images,
So that I can paste them into external presentation slides or documents.

## Acceptance Criteria

### AC 1: Export Controls
- [x] Each chart widget has a "menu" icon (three dots) with options: "Download PNG", "Download SVG".

### AC 2: Image Quality
- [x] Exported images are high resolution (at least 2x scale for PNG).
- [x] SVG exports preserve vector scalability.

## Design & Implementation

### Component Structure
- **`ChartWrapper.tsx`**: Reusable container that adds the export menu.

### Libraries
- `html-to-image` or `recharts`' built-in export features if available.

## Dependencies
- Stories 6.1-6.4 (The charts to export).
