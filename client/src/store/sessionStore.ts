import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  id: string;
  name: string;
  timestamp: number;
  packetCount: number;
  fileHash?: string;
  duration?: number;
  size?: number;
}

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  addSession: (session: Session) => void;
  setActiveSession: (id: string | null) => void;
  removeSession: (id: string) => void;
  clearSessions: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      addSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, session],
          activeSessionId: session.id, // Auto-select new session
        })),
      setActiveSession: (id) => set({ activeSessionId: id }),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId:
            state.activeSessionId === id ? null : state.activeSessionId,
        })),
      clearSessions: () => set({ sessions: [], activeSessionId: null }),
    }),
    {
      name: 'session-storage',
    },
  ),
);
