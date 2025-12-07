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
});
