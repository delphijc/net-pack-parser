import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavigationTimingView } from './NavigationTimingView';
import * as useNavigationTimingModule from '../../hooks/useNavigationTiming';

// Mock the hook
vi.mock('../../hooks/useNavigationTiming', () => ({
  useNavigationTiming: vi.fn(),
}));

describe('NavigationTimingView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unsupported state correctly', () => {
    (useNavigationTimingModule.useNavigationTiming as any).mockReturnValue({
      metrics: null,
      entry: null,
      isSupported: false,
    });

    render(<NavigationTimingView />);
    expect(
      screen.getByText('Not supported in this browser.'),
    ).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    (useNavigationTimingModule.useNavigationTiming as any).mockReturnValue({
      metrics: null,
      entry: null,
      isSupported: true,
    });

    render(<NavigationTimingView />);
    expect(
      screen.getByText('Waiting for page load data...'),
    ).toBeInTheDocument();
  });

  it('renders metrics data correctly when supported', () => {
    (useNavigationTimingModule.useNavigationTiming as any).mockReturnValue({
      metrics: {
        loadTime: 500,
        dns: 10,
        tcp: 20,
        request: 30,
        response: 40,
        domProcessing: 300,
        domComplete: 450,
        loadEvent: 100,
        ttfb: 60,
      },
      entry: {},
      isSupported: true,
    });

    render(<NavigationTimingView />);

    // Check header info
    expect(screen.getByText('Navigation Timing')).toBeInTheDocument();
    expect(screen.getByText('TTFB: 60ms')).toBeInTheDocument();
    expect(screen.getByText('Total Load: 500ms')).toBeInTheDocument();

    // Check phases in legend
    expect(screen.getByText('DNS')).toBeInTheDocument();
    expect(screen.getByText('10ms')).toBeInTheDocument();

    expect(screen.getByText('TCP')).toBeInTheDocument();
    expect(screen.getByText('20ms')).toBeInTheDocument();

    expect(screen.getByText('DOM')).toBeInTheDocument();
    expect(screen.getByText('300ms')).toBeInTheDocument();
  });
});
