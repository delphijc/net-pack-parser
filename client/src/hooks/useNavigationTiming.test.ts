import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNavigationTiming } from './useNavigationTiming';

describe('useNavigationTiming', () => {
  const originalPerformance = window.performance;

  beforeEach(() => {
    // Reset performance mock
    Object.defineProperty(window, 'performance', {
      writable: true,
      configurable: true, // critical for repeated mocking
      value: {
        getEntriesByType: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'performance', {
      writable: true,
      configurable: true,
      value: originalPerformance,
    });
    vi.clearAllMocks();
  });

  it('should initialize with null state', () => {
    (window.performance.getEntriesByType as any).mockReturnValue([]);
    const { result } = renderHook(() => useNavigationTiming());

    expect(result.current.metrics).toBeNull();
    expect(result.current.isSupported).toBe(true);
  });

  it('should calculate metrics correctly when navigation entry exists', () => {
    const mockEntry = {
      toJSON: () => {},
      entryType: 'navigation',
      name: 'http://localhost',
      startTime: 0,
      duration: 1000,
      initiatorType: 'navigation',
      nextHopProtocol: 'h2',
      workerStart: 0,
      redirectStart: 0,
      redirectEnd: 0,
      fetchStart: 0,
      domainLookupStart: 10,
      domainLookupEnd: 30, // DNS: 20
      connectStart: 30,
      secureConnectionStart: 0,
      connectEnd: 80, // TCP: 50
      requestStart: 80,
      responseStart: 100, // TTFB: 100
      responseEnd: 150, // Response: 50, Request: 20
      transferSize: 1000,
      encodedBodySize: 900,
      decodedBodySize: 900,
      serverTiming: [],
      unloadEventStart: 0,
      unloadEventEnd: 0,
      domInteractive: 200,
      domContentLoadedEventStart: 210,
      domContentLoadedEventEnd: 220,
      domComplete: 300, // DOM Processing: 100 (300-200)
      loadEventStart: 300,
      loadEventEnd: 310, // Load: 10
      type: 'navigate',
      redirectCount: 0,
    };

    (window.performance.getEntriesByType as any).mockReturnValue([mockEntry]);

    const { result } = renderHook(() => useNavigationTiming());

    // We might need to wait for useEffect or trigger an update if it depends on 'load' event
    // But the hook checks immediately if document is ready.
    // In test environment, document.readyState might be 'complete' or we can mock it.

    // Force update if needed via effect (the hook effect runs on mount)
    // The hook logic checks immediately if readyState is complete.

    expect(result.current.metrics).toEqual({
      loadTime: 310,
      dns: 20,
      tcp: 50,
      request: 20,
      response: 50,
      domProcessing: 100,
      domComplete: 300,
      loadEvent: 10,
      ttfb: 100,
    });
  });

  it('should handle missing support gracefully', () => {
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useNavigationTiming());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.metrics).toBeNull();
  });
});
