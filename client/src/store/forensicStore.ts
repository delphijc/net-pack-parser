import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bookmark, CaseMetadata } from '../types/forensics';

interface ForensicState {
    bookmarks: Bookmark[];
    caseMetadata: CaseMetadata | null;
    addBookmark: (bookmark: Bookmark) => void;
    removeBookmark: (id: string) => void;
    updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
    updateCaseMetadata: (updates: Partial<CaseMetadata>) => void;
    reset: () => void;
}

export const useForensicStore = create<ForensicState>()(
    persist(
        (set) => ({
            bookmarks: [],
            caseMetadata: null,
            addBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
            removeBookmark: (id) => set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
            updateBookmark: (id, updates) => set((state) => ({
                bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
            })),
            updateCaseMetadata: (updates) => set((state) => ({
                caseMetadata: state.caseMetadata ? { ...state.caseMetadata, ...updates } : (updates as CaseMetadata) // Handle init vs update
            })),
            reset: () => set({ bookmarks: [], caseMetadata: null }),
        }),
        {
            name: 'forensic-storage',
        }
    )
);
