import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAlertStore } from './alertStore';

// Mock persist middleware to bypass storage
vi.mock('zustand/middleware', () => ({
  persist: (config: unknown) => (set: unknown, get: unknown, api: unknown) =>
    (config as (...args: unknown[]) => unknown)(set, get, api),
}));

describe('useAlertStore', () => {
  beforeEach(() => {
    // Reset store state
    useAlertStore.setState({ alertStates: {} });
    vi.clearAllMocks();
  });

  it('should mark an alert as false positive', () => {
    const { markFalsePositive, getAlertState } = useAlertStore.getState();
    markFalsePositive('alert-1');
    expect(getAlertState('alert-1')?.status).toBe('false_positive');
  });

  it('should confirm a threat', () => {
    const { confirmThreat, getAlertState } = useAlertStore.getState();
    confirmThreat('alert-1');
    expect(getAlertState('alert-1')?.status).toBe('confirmed');
  });

  it('should restore an alert', () => {
    const { markFalsePositive, restoreAlert, getAlertState } =
      useAlertStore.getState();
    markFalsePositive('alert-1');
    restoreAlert('alert-1');
    expect(getAlertState('alert-1')?.status).toBe('active');
  });

  it('should add notes', () => {
    const { addNote, getAlertState } = useAlertStore.getState();
    addNote('alert-1', 'Test note');
    expect(getAlertState('alert-1')?.notes).toContain('Test note');

    addNote('alert-1', 'Another note');
    expect(getAlertState('alert-1')?.notes).toHaveLength(2);
  });
});
