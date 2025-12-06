import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WaterfallChart } from './WaterfallChart';
import {
  usePerformanceStore,
  ResourceTiming,
} from '../../store/performanceStore';

describe('WaterfallChart', () => {
  beforeEach(() => {
    usePerformanceStore.setState({ resources: [] });
  });

  it('renders without crashing', () => {
    render(<WaterfallChart />);
    expect(screen.getByText(/Waterfall/i)).toBeInTheDocument();
  });

  it('displays resource bars', () => {
    const resources: ResourceTiming[] = [
      {
        id: 'res-1',
        name: 'http://example.com/api',
        initiatorType: 'fetch',
        startTime: 100,
        duration: 50,
        transferSize: 500,
        breakdown: { dns: 0, tcp: 0, ttfb: 10, download: 40 },
      },
    ];

    usePerformanceStore.setState({ resources });

    render(<WaterfallChart />);
    expect(screen.getByText('api')).toBeInTheDocument();
    // Also verify full URL is accessible via title
    expect(screen.getByTitle('http://example.com/api')).toBeInTheDocument();
  });
});
