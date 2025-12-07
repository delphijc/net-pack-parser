
import { create } from 'zustand';

interface TimelineState {
    startTime: number | null;
    endTime: number | null;
    setRange: (start: number | null, end: number | null) => void;
    resetRange: () => void;
    // Actions for zoom buttons could be calculated here or in components,
    // but keeping state simple is often better.
}

export const useTimelineStore = create<TimelineState>((set) => ({
    startTime: null,
    endTime: null,
    setRange: (startTime, endTime) => set({ startTime, endTime }),
    resetRange: () => set({ startTime: null, endTime: null }),
}));
