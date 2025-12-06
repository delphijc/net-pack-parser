import { describe, it, expect, beforeEach } from 'vitest';
import { usePerformanceStore, LongTask } from './performanceStore';

describe('performanceStore', () => {
  beforeEach(() => {
    usePerformanceStore.getState().resetMetrics();
  });

  it('should limit long tasks to 50 items', () => {
    const store = usePerformanceStore.getState();

    // Add 55 items
    for (let i = 0; i < 55; i++) {
      const task: LongTask = {
        id: `id-${i}`,
        startTime: i * 10,
        duration: 60,
        attribution: 'script',
        timestamp: Date.now() + i,
      };
      store.addLongTask(task);
    }

    const state = usePerformanceStore.getState();

    // Should cap at 50
    expect(state.longTasks.length).toBe(50);

    // Should keep the most recent ones (conceptually LIFO in the UI list, but stored as [new, ...old])
    // If implementation is [task, ...state.longTasks], then index 0 is the newest (id-54).
    // The ones dropped should be id-0...id-4.

    expect(state.longTasks[0].id).toBe('id-54');
    expect(state.longTasks[49].id).toBe('id-5');
  });
});
