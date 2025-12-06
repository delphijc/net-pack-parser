# Story 7.1: Capture Agent Project Setup

**Story ID:** 7.1
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a developer,
I want to set up the Node.js backend infrastructure with necessary native bindings,
So that I can start building the capture logic.

## Acceptance Criteria

### AC 1: Project Structure
- [ ] `server/` directory initialized with `package.json`, `tsconfig.json`.
- [ ] Dependencies installed: `express`, `cap` (or `pcap`), `typescript`.
- [ ] Linting and formatting set up (ESLint/Prettier).

### AC 2: Native Compiling
- [ ] `npm install` successfully builds the native C++ bindings for the capture library on the host OS.

## Design & Implementation

### Component Structure
- **`server/src/index.ts`**: Entry point.

## Dependencies
- None.
