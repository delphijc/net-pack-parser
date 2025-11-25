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
