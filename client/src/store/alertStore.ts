import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AlertState {
    status: 'active' | 'false_positive' | 'confirmed';
    notes: string[];
}

interface AlertStore {
    alertStates: Record<string, AlertState>;
    markFalsePositive: (id: string) => void;
    confirmThreat: (id: string) => void;
    restoreAlert: (id: string) => void;
    addNote: (id: string, note: string) => void;
    getAlertState: (id: string) => AlertState | undefined;
}

export const useAlertStore = create<AlertStore>()(
    persist(
        (set, get) => ({
            alertStates: {},

            markFalsePositive: (id) =>
                set((state) => ({
                    alertStates: {
                        ...state.alertStates,
                        [id]: {
                            ...(state.alertStates[id] || { notes: [] }),
                            status: 'false_positive',
                        },
                    },
                })),

            confirmThreat: (id) =>
                set((state) => ({
                    alertStates: {
                        ...state.alertStates,
                        [id]: {
                            ...(state.alertStates[id] || { notes: [] }),
                            status: 'confirmed',
                        },
                    },
                })),

            restoreAlert: (id) =>
                set((state) => ({
                    alertStates: {
                        ...state.alertStates,
                        [id]: {
                            ...(state.alertStates[id] || { notes: [] }),
                            status: 'active',
                        },
                    },
                })),

            addNote: (id, note) =>
                set((state) => ({
                    alertStates: {
                        ...state.alertStates,
                        [id]: {
                            ...(state.alertStates[id] || { status: 'active' }),
                            notes: [...(state.alertStates[id]?.notes || []), note],
                        },
                    },
                })),

            getAlertState: (id) => get().alertStates[id],
        }),
        {
            name: 'alert-storage',
        },
    ),
);
