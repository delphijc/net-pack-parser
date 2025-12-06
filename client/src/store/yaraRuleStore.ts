// client/src/store/yaraRuleStore.ts

import { create } from 'zustand';
import { openDB, type IDBPDatabase } from 'idb';
import { yaraEngine } from '../services/yaraEngine';

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

const DB_NAME = 'yara-rules-db';
const STORE_NAME = 'rules';

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    },
  });
}

export const useYaraRuleStore = create<YaraRuleState>((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  loadRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const rules = await db.getAll(STORE_NAME);
      set({ rules });
      await get().compileActiveRules();
    } catch (error: unknown) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addRule: async (name: string, content: string) => {
    const id = crypto.randomUUID();
    const newRule = { id, name, content, enabled: true };
    const db = await getDb();
    await db.put(STORE_NAME, newRule);
    set((state) => ({ rules: [...state.rules, newRule] }));
    await get().compileActiveRules();
  },

  toggleRule: async (id: string) => {
    const db = await getDb();
    const rule = await db.get(STORE_NAME, id);
    if (rule) {
      rule.enabled = !rule.enabled;
      await db.put(STORE_NAME, rule);
      set((state) => ({
        rules: state.rules.map((r) =>
          r.id === id ? { ...r, enabled: rule.enabled } : r,
        ),
      }));
      await get().compileActiveRules();
    }
  },

  deleteRule: async (id: string) => {
    const db = await getDb();
    await db.delete(STORE_NAME, id);
    set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }));
    await get().compileActiveRules();
  },

  compileActiveRules: async () => {
    const activeRules = get()
      .rules.filter((r) => r.enabled)
      .map((r) => r.content);
    if (activeRules.length > 0) {
      try {
        await yaraEngine.compileRules(activeRules);
      } catch (e) {
        console.error('Failed to compile YARA rules', e);
      }
    }
  },
}));
