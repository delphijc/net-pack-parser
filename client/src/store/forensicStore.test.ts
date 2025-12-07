import { describe, it, expect, beforeEach } from 'vitest';
import { useForensicStore } from './forensicStore';
import type { Bookmark } from '../types/forensics';

describe('useForensicStore', () => {
    beforeEach(() => {
        useForensicStore.getState().reset();
    });

    it('should add a bookmark', () => {
        const bookmark: Bookmark = {
            id: '1',
            timestamp: 1234567890,
            label: 'Suspicious Activity',
            note: 'Investigate this timestamp',
            author: 'Analyst',
        };

        useForensicStore.getState().addBookmark(bookmark);

        expect(useForensicStore.getState().bookmarks).toHaveLength(1);
        expect(useForensicStore.getState().bookmarks[0]).toEqual(bookmark);
    });

    it('should remove a bookmark', () => {
        const bookmark: Bookmark = {
            id: '1',
            timestamp: 1234567890,
            label: 'Suspicious',
            note: 'Test',
        };
        useForensicStore.getState().addBookmark(bookmark);
        useForensicStore.getState().removeBookmark('1');

        expect(useForensicStore.getState().bookmarks).toHaveLength(0);
    });

    it('should update a bookmark', () => {
        const bookmark: Bookmark = {
            id: '1',
            timestamp: 1234567890,
            label: 'Original',
            note: 'Original Note',
        };
        useForensicStore.getState().addBookmark(bookmark);

        useForensicStore.getState().updateBookmark('1', { note: 'Updated Note' });

        const updated = useForensicStore.getState().bookmarks[0];
        expect(updated.note).toBe('Updated Note');
        expect(updated.label).toBe('Original'); // Should preserve other fields
    });

    it('should manage case metadata', () => {
        const metadata = {
            caseId: 'case-123',
            caseName: 'Investigation A',
            investigator: 'John Doe',
            organization: 'ACME Corp',
            summary: 'Initial summary',
            startDate: '2023-01-01',
        };


        // Property 'updateCaseMetadata' exists now
        useForensicStore.getState().updateCaseMetadata(metadata);

        // Property 'caseMetadata' exists now
        const stored = useForensicStore.getState().caseMetadata;

        expect(stored).toEqual(metadata);

        // Update partial
        useForensicStore.getState().updateCaseMetadata({ summary: 'Updated summary' });

        expect(useForensicStore.getState().caseMetadata!.summary).toBe('Updated summary');
        expect(useForensicStore.getState().caseMetadata!.investigator).toBe('John Doe');
        expect(useForensicStore.getState().caseMetadata!.organization).toBe('ACME Corp');
    });
});
