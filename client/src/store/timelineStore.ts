
import { create } from 'zustand';

interface TimelineState {
    startTime: number | null;
    endTime: number | null;
    showThreatsOnly: boolean;
    selectedProtocol: string | null;
    setRange: (start: number | null, end: number | null) => void;
    resetRange: () => void;
    toggleThreatsOnly: () => void;
    setProtocol: (protocol: string | null) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
    startTime: null,
    endTime: null,
    showThreatsOnly: false,
    selectedProtocol: null,
    setRange: (startTime, endTime) => set({ startTime, endTime }),
    resetRange: () => set({ startTime: null, endTime: null }),
    toggleThreatsOnly: () => set((state) => ({ showThreatsOnly: !state.showThreatsOnly })),
    setProtocol: (protocol) => set({ selectedProtocol: protocol }),
}));
