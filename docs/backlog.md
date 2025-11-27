# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story’s `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2025-11-22 | 1.1 | 1 | Bug | Medium | TBD | Open | Integrate 'deep-blue' and 'teal' colors into the root theme in `client/src/index.css`. |
| 2025-11-22 | 1.1 | 1 | TechDebt | Low | TBD | Open | Update `architecture.md` to reflect correct Vite/TS versions. |
| 2025-11-22 | 1.1 | 1 | Test | Medium | TBD | Open | Provide verifiable evidence for the npm run dev functionality (AC #5). |
| 2025-11-23 | 1.2 | 1 | Feature | Medium | TBD | Open | Implement data versioning logic in `localStorage.ts`. [file: `client/src/services/localStorage.ts:12`] |
| 2025-11-23 | 1.2 | 1 | Process | High | TBD | Open | Update the "Tasks / Subtasks" section in story 1.2 to accurately reflect completion status. |
| 2025-11-24 | 1.3 | 1 | Test | High | TBD | Open | Unskip and fix unit test for `generateExportJson`. Verify AC1 and AC2. [file: `client/src/utils/dataImportExport.test.ts:42`] |
| 2025-11-24 | 1.3 | 1 | Test | High | TBD | Open | Unskip and fix component tests for `SettingsPage`. Verify AC1, AC5, AC6. [file: `client/src/components/SettingsPage.test.tsx:12`] |
| 2025-11-24 | 1.3 | 1 | TechDebt | Low | TBD | Open | Dynamically read `APP_VERSION` from `package.json`. [file: `client/src/utils/dataImportExport.ts:5`] |
| 2025-11-26 | 1.6 | 1 | Feature | Medium | TBD | Open | Implement Acceptance Criterion 5: "And extracted strings from the payload are highlighted (if any)." This functionality is explicitly deferred to Story 1.7 but is an AC for this story. This should be addressed either by implementing it or by moving AC5 to Story 1.7. |
| 2025-11-26 | 1.6 | 1 | Test | Low | TBD | Open | Add unit/component tests for `PacketDetailView.tsx` to verify the rendering of the monospace font for the hex dump, as specified in UX Design. |
| 2025-11-26 | 1.6 | 1 | Performance | Low | TBD | Open | Evaluate performance of `generateHexDump` with large packet payloads and consider offloading to a Web Worker for future optimization (Referenced in Story 1.6 Dev Notes and Epic Tech Spec).
| 2025-11-26 | 1.6 | 1 | Performance | Low | TBD | Open | Evaluate performance of `generateHexDump` with large packet payloads and consider offloading to a Web Worker for future optimization (Referenced in Story 1.6 Dev Notes and Epic Tech Spec).
| 2025-11-27 | 1.7 | 1 | TechDebt | Low | TBD | Open | Consider removing the redundant `category` field from `ExtractedString` interface in a future refactor. [file: `client/src/types/extractedStrings.ts`] |
| 2025-11-27 | 1.7 | 1 | Performance | Low | TBD | Open | Monitor performance of regex matching on extremely large packets; if issues arise, consider chunking the payload or optimizing regexes. [file: `client/src/utils/stringExtractor.ts`] |
| 2025-11-27 | 1.7 | 1 | Performance | Low | TBD | Open | For the "Extracted Strings" table, if the number of strings is very large (>1000), consider implementing virtual scrolling. [file: `client/src/components/ExtractedStringsTab.tsx`] |
