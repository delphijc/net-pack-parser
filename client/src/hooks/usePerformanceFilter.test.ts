import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePerformanceFilter } from './usePerformanceFilter';
import { ResourceTiming, LongTask } from '../store/performanceStore';

describe('usePerformanceFilter', () => {
  const mockResources: ResourceTiming[] = [
    {
      id: '1',
      name: 'script.js',
      initiatorType: 'script',
      duration: 100,
    } as any,
    { id: '2', name: 'style.css', initiatorType: 'css', duration: 50 } as any,
    { id: '3', name: 'image.png', initiatorType: 'img', duration: 10 } as any,
  ];

  const mockLongTasks: LongTask[] = [
    { id: '1', duration: 60 } as any,
    { id: '2', duration: 200 } as any,
  ];

  it('filters resources by type', () => {
    const { result } = renderHook(() => usePerformanceFilter());

    act(() => {
      result.current.setResourceType('script');
    });

    const filtered = result.current.filterResources(mockResources);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].initiatorType).toBe('script');
  });

  it('filters resources by min duration', () => {
    const { result } = renderHook(() => usePerformanceFilter());

    act(() => {
      result.current.setMinDuration(60);
    });

    const filtered = result.current.filterResources(mockResources);
    expect(filtered).toHaveLength(1); // script.js (100ms)
    expect(filtered[0].id).toBe('1');
  });

  it('filters long tasks by min duration', () => {
    const { result } = renderHook(() => usePerformanceFilter());

    act(() => {
      result.current.setMinDuration(100);
    });

    const filtered = result.current.filterLongTasks(mockLongTasks);
    expect(filtered).toHaveLength(1); // Task 2 (200ms)
  });

  it('filters resources by domain (internal/external)', () => {
    const { result } = renderHook(() => usePerformanceFilter());
    const domainResources: ResourceTiming[] = [
      { id: '1', name: 'http://localhost:5173/script.js', initiatorType: 'script', duration: 100 } as any,
      { id: '2', name: 'https://thirdparty.com/analytics.js', initiatorType: 'script', duration: 50 } as any,
      { id: '3', name: '/local-asset.png', initiatorType: 'img', duration: 10 } as any, // Relative path is internal
    ];

    // Mock window.location for test environment
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:5173',
        hostname: 'localhost'
      },
      writable: true
    });

    // Test Internal
    act(() => {
      result.current.setDomain('internal');
    });
    const internal = result.current.filterResources(domainResources);
    expect(internal).toHaveLength(2); // localhost and relative
    expect(internal.map(r => r.id)).toContain('1');
    expect(internal.map(r => r.id)).toContain('3');

    // Test External
    act(() => {
      result.current.setDomain('external');
    });
    const external = result.current.filterResources(domainResources);
    expect(external).toHaveLength(1);
    expect(external[0].id).toBe('2');
  });
});
