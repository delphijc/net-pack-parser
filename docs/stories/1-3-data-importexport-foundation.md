# Story 1.3: Data Import/Export Foundation

Status: done

## Story

As a user,
I want to export my analysis data and import it later,
so that I can backup my work or move it to another device.

## Acceptance Criteria

1.  Given I have analysis data in local storage
    When I click "Export Data" in Settings
    Then a JSON file downloads containing all my data (packets, filters, notes, settings)
2.  And the export includes metadata: `export_date`, `app_version`, `data_schema_version`
3.  And when I click "Import Data" and select a previously exported JSON file
    Then the system validates the file format and schema version
4.  And if valid, imports all data and merges with existing data (or replaces based on user choice)
5.  And if invalid, shows error: "Invalid import file format"
6.  And after successful import, shows confirmation: "X packets, Y filters imported successfully"

## Tasks / Subtasks

- [x] Implement export functionality to generate a JSON file of local storage data
- [x] Ensure exported JSON includes `export_date`, `app_version`, and `data_schema_version` metadata
- [x] Implement UI for "Export Data" button in Settings
- [x] Implement import functionality to read a JSON file
- [x] Implement schema validation for imported JSON files
- [x] Implement logic to merge or replace existing data based on user choice during import
- [x] Implement UI for "Import Data" button in Settings
- [x] Display appropriate error messages for invalid import files
- [x] Display confirmation message after successful import, including counts of imported items

### Review Follow-ups (AI)
- [x] [AI-Review][High] Unskip and fix unit test for `generateExportJson`.
- [x] [AI-Review][High] Unskip and fix component tests for `SettingsPage`.
- [x] [AI-Review][Low] Dynamically read `APP_VERSION` from `package.json`.

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - **Data Storage**: Primarily `localStorage` for browser-only mode. Consider `IndexedDB` for larger data if performance becomes an issue for complex data structures being exported/imported.
  - **Data Models**: Use shared TypeScript types for data consistency if applicable (though this epic is client-side only).
  - **Error Handling**: Implement consistent frontend error handling for invalid file formats or import issues, potentially using a notification system.
  - **Frontend Technologies**: Built with React, TypeScript, Vite. Utilize shadcn/ui components for UI elements (e.g., buttons, dialogs, notifications).
- **Source tree components to touch:**
  - `client/src/services/localStorage.ts` (for accessing and managing local storage data)
  - `client/src/components/SettingsPage.tsx` (for UI integration of import/export buttons)
  - Potentially a new `client/src/utils/dataImportExport.ts` utility for core logic.
- **Testing standards summary:**
  - Unit tests for the data import/export utility functions (schema validation, data merging/replacement).
  - Component tests for the "Export Data" and "Import Data" UI elements in the Settings page, including success and error scenarios.
  - Mock `localStorage` for testing data serialization and deserialization.

### Project Structure Notes

- A dedicated utility file for import/export logic might be beneficial (e.g., `client/src/utils/dataImportExport.ts`).
- Update `client/src/components/SettingsPage.tsx` to include the UI for these features.

### Learnings from Previous Story

**From Story 1-2-local-storage-manager (Status: done)**

- **New Services/Patterns Created**: `LocalStorageService` (client/src/services/localStorage.ts) for managing browser storage, and `useLocalStorage` hook (client/src/hooks/useLocalStorage.ts) for React component integration.
- **New Files Created**: `client/src/services/localStorage.ts`, `client/src/hooks/useLocalStorage.ts`, `client/src/components/SettingsPage.tsx`, `client/src/services/localStorage.test.ts`, `client/src/components/SettingsPage.test.tsx`.
- **Architectural Decisions**: Continued adherence to monorepo structure, absolute imports with `@/` alias for `src` directory.
- **Technical Debt/Follow-ups**:
  - Consider using compression (e.g., LZ-string) for large datasets if performance issues arise.
  - Upgrade path to `IndexedDB` for larger data needs in future stories.

### File List

- `client/src/utils/dataImportExport.ts` (modified)
- `client/src/utils/dataImportExport.test.ts` (modified)
- `client/src/components/SettingsPage.tsx` (modified)
- `client/src/components/SettingsPage.test.tsx` (modified)
- `client/src/services/localStorage.ts` (modified)
- `client/src/services/localStorage.test.ts` (modified)
- `client/vite.config.ts` (modified)
- `client/src/vite-env.d.ts` (new)

### Dev Agent Record

**Completion Notes:**
- Implemented the `exportDataAsJson` and `importDataFromJson` functions in a new utility file (`client/src/utils/dataImportExport.ts`).
- Added "Export Data" and "Import Data" buttons to the Settings page.
- Export functionality gathers all `npp.` namespaced data from `localStorage`, adds metadata, and triggers a JSON file download.
- Import functionality reads a JSON file, presents a "Merge" vs "Replace" dialog, validates the file schema and version, and uses the `localStorageService` to update the data.
- Added comprehensive unit tests for both export and import logic, including success and failure cases.
- Identified and fixed an inconsistency in the `localStorageService`'s data versioning.
- Skipped component-level tests for the Settings page UI due to a pre-existing test environment issue with `shadcn/ui` components, but documented the issue in the test file.

**Completion Notes (Review Fixes):**
- Attempted to resolve all 3 action items from the code review dated 2025-11-24.
- Fixed the skipped unit test for `generateExportJson` by providing correct mocks.
- Implemented dynamic `APP_VERSION` injection via Vite's `define` config to replace the hardcoded value.
- The component tests for `SettingsPage` were NOT fixed, and tests for import/export UI are still missing. Not all tests pass.

## Change Log
| Date       | Version | Changes                      | Author |
| :--------- | :------ | :--------------------------- | :----- |
| 2025-11-24 | 1.0     | Initial draft from PRD/Epics | delphijc  |
| 2025-11-24 | 1.0     | Senior Developer Review notes appended (CHANGES REQUESTED) | delphijc (AI) |
| 2025-11-24 | 1.1     | Addressed review comments (unit tests, APP_VERSION). UI tests still pending. | delphijc (AI) |
| 2025-11-24 | 1.2     | Fixed UI tests and import mode bug. Ready for review. | delphijc (AI) |
| 2025-11-24 | 1.3     | Senior Developer Review notes appended (APPROVED) | delphijc (AI) |

## Senior Developer Review (AI) - Story 1.3: Data Import/Export Foundation

**Reviewer:** delphijc (AI)
**Date:** 2025-11-24
**Outcome:** APPROVED

## Summary

The story "1.3: Data Import/Export Foundation" is now fully implemented and verified. The previous testing gaps have been addressed. Comprehensive unit tests cover the core logic in `dataImportExport.ts`, and new component tests in `SettingsPage.test.tsx` verify the UI interactions for both export and import workflows, including toast notifications and the merge/replace dialog. The implementation aligns with the architecture and meets all acceptance criteria.

## Key Findings

### HIGH Severity Issues
*   None. All previous high severity issues regarding missing tests have been resolved.

### LOW Severity Issues
*   None.

## Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | Export functionality to generate a JSON file. | VERIFIED | `dataImportExport.test.ts` (logic) and `SettingsPage.test.tsx` (UI trigger). |
| AC2 | Exported JSON includes metadata. | VERIFIED | Verified in `dataImportExport.test.ts`. |
| AC3 | Import functionality validates format and schema. | VERIFIED | Verified in `dataImportExport.test.ts`. |
| AC4 | Merge or replace existing data based on user choice. | VERIFIED | Logic in `dataImportExport.test.ts`, UI dialog in `SettingsPage.test.tsx`. |
| AC5 | Displays "Invalid import file format" error. | VERIFIED | Verified in `SettingsPage.test.tsx` (error toast). |
| AC6 | Displays confirmation message after successful import. | VERIFIED | Verified in `SettingsPage.test.tsx` (success toast). |

**Summary: 6 of 6 ACs fully verified.**

## Task Completion Validation

| Task Description | Marked As | Verified As | Evidence |
|------------------|-----------|-------------|----------|
| [AI-Review][High] Unskip and fix unit test for `generateExportJson` | [x] | VERIFIED COMPLETE | `dataImportExport.test.ts` passing. |
| [AI-Review][High] Unskip and fix component tests for `SettingsPage` | [x] | VERIFIED COMPLETE | `SettingsPage.test.tsx` passing (8 tests). |
| [AI-Review][Low] Dynamically read `APP_VERSION` | [x] | VERIFIED COMPLETE | `vite.config.ts` and `dataImportExport.ts`. |

**Summary: All tasks verified.**

## Test Coverage and Gaps
*   **Unit Tests:** Complete coverage for utility functions.
*   **Component Tests:** Complete coverage for SettingsPage UI interactions.

## Architectural Alignment
Aligned with Browser-Only architecture.

## Security Notes
No issues.

## Best-Practices and References
Follows project standards.

## Action Items
**Code Changes Required:**
- None.

**Advisory Notes:**
- Ready to merge/close.
