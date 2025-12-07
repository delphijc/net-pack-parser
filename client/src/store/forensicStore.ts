import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bookmark } from '../types/forensics';

interface ForensicState {
    bookmarks: Bookmark[];
    addBookmark: (bookmark: Bookmark) => void;
    removeBookmark: (id: string) => void;
    updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
    reset: () => void;
}

export const useForensicStore = create<ForensicState>()(
    persist(
        (set) => ({
            bookmarks: [],
            addBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
            removeBookmark: (id) => set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
            updateBookmark: (id, updates) => set((state) => ({
                bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
            })),
            reset: () => set({ bookmarks: [] }),
        }),
        {
            name: 'forensic-storage',
        }
    )
);
