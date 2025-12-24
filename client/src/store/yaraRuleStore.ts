import { create } from 'zustand';
import { API_BASE_URL } from '../services/api';

interface YaraRule {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
}

interface YaraRuleState {
  rules: YaraRule[];
  isLoading: boolean;
  error: string | null;
  loadRules: () => Promise<void>;
  addRule: (name: string, content: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  compileActiveRules: () => Promise<void>;
}

export const useYaraRuleStore = create<YaraRuleState>((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  // ... existing code ...

  loadRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/yara`);
      if (!response.ok) throw new Error('Failed to fetch rules');
      const rules = await response.json();
      set({ rules });
      // Server compiles automatically
    } catch (error: unknown) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addRule: async (name: string, content: string) => {
    try {
      await fetch(`${API_BASE_URL}/yara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      });
      await get().loadRules();
    } catch (e) {
      console.error('Failed to add rule', e);
    }
  },

  toggleRule: async (_id: string) => {
    // Not implemented on server
    console.warn('Toggle rule not supported on server MVP');
  },

  deleteRule: async (_id: string) => {
    // Not implemented on server
    console.warn('Delete rule not supported on server MVP');
  },

  compileActiveRules: async () => {
    // Server handles this
  },
}));
