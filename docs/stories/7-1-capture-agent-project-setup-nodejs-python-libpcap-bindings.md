# Story 7.1: Capture Agent Project Setup

**Story ID:** 7.1
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a developer,
I want to set up the Node.js backend infrastructure with necessary native bindings,
So that I can start building the capture logic.

## Acceptance Criteria

### AC 1: Project Structure
- [x] `server/` directory initialized with `package.json`, `tsconfig.json`.
- [x] Dependencies: `express`, `cap`, `typescript`, `ws` installed.
- [x] ESLint configured.

### AC 2: Native Compiling
- [x] `npm install` builds native bindings for `cap` library.

## Design & Implementation

### Component Structure
- **`server/src/index.ts`**: Entry point.

## Dependencies
- None.
