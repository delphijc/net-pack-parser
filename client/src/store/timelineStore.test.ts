
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTimelineStore } from './timelineStore';

describe('useTimelineStore', () => {
    beforeEach(() => {
        // Reset store before each test (though simpler with creating a fresh store, 
        // with Zustand singleton we can just call resetRange)
        const { result } = renderHook(() => useTimelineStore());
        act(() => {
            result.current.resetRange();
        });
    });

    it('should initialize with null range', () => {
        const { result } = renderHook(() => useTimelineStore());
        expect(result.current.startTime).toBeNull();
        expect(result.current.endTime).toBeNull();
    });

    it('should set range', () => {
        const { result } = renderHook(() => useTimelineStore());
        act(() => {
            result.current.setRange(1000, 2000);
        });
        expect(result.current.startTime).toBe(1000);
        expect(result.current.endTime).toBe(2000);
    });

    it('should reset range', () => {
        const { result } = renderHook(() => useTimelineStore());
        act(() => {
            result.current.setRange(1000, 2000);
        });
        expect(result.current.startTime).toBe(1000);

        act(() => {
            result.current.resetRange();
        });
        expect(result.current.startTime).toBeNull();
        expect(result.current.endTime).toBeNull();
    });
});
