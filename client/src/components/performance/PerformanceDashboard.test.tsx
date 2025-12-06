import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { PerformanceDashboard } from './PerformanceDashboard';
import { usePerformanceStore } from '../../store/performanceStore';
import * as TrendRecorderHook from '../../hooks/useTrendRecorder';

// Mock dependencies
vi.mock('../../hooks/usePerformanceObserver', () => ({
  usePerformanceObserver: vi.fn(),
}));

// Mock child components
vi.mock('./ScoreGauge', () => ({
  ScoreGauge: () => <div data-testid="score-gauge">Score Gauge</div>,
}));
vi.mock('./VitalsCard', () => ({
  VitalsCard: ({ metric }: any) => (
    <div data-testid={'metric-' + metric.name}>{metric.name}</div>
  ),
}));
vi.mock('./NavigationTimingView', () => ({
  NavigationTimingView: () => <div data-testid="nav-timing">Nav Timing</div>,
}));
vi.mock('./LongTasksView', () => ({
  LongTasksView: () => <div data-testid="long-tasks">Long Tasks</div>,
}));
vi.mock('./WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall">Waterfall</div>,
}));
vi.mock('./TrendGraph', () => ({
  TrendGraph: () => <div data-testid="trend-graph">Trend Graph</div>,
}));
vi.mock('./TrendControls', () => ({
  TrendControls: () => <div data-testid="trend-controls">Trend Controls</div>,
}));
vi.mock('./PerformanceFilters', () => ({
  PerformanceFilters: ({ onResourceTypeChange }: any) => (
    <div data-testid="performance-filters">
      <button onClick={() => onResourceTypeChange('script')}>
        Filter Script
      </button>
    </div>
  ),
}));

vi.mock('./ServerMonitor', () => ({
  ServerMonitor: () => <div data-testid="server-monitor">Server Monitor</div>,
}));

vi.mock('../../hooks/useTrendRecorder', () => ({
  useTrendRecorder: vi.fn(),
}));

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePerformanceStore.setState({
      metrics: {},
      score: 95,
      resources: [],
      longTasks: [],
    });
  });

  it('renders the dashboard components', () => {
    render(<PerformanceDashboard />);
    expect(screen.getByText('performance dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('waterfall')).toBeInTheDocument();
    expect(screen.getByTestId('nav-timing')).toBeInTheDocument();
    expect(screen.getByTestId('long-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('trend-graph')).toBeInTheDocument();
    expect(screen.getByTestId('trend-controls')).toBeInTheDocument();
  });

  it('export button triggers download', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();

    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    render(<PerformanceDashboard />);
    const exportBtn = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    const anchorCall = appendSpy.mock.calls.find(
      (call) => (call[0] as HTMLElement).tagName === 'A',
    );
    expect(anchorCall).toBeDefined();
    const appendedNode = anchorCall![0] as HTMLAnchorElement;
    expect(appendedNode.tagName).toBe('A');
    expect(appendedNode.download).toMatch(/performance-data-.*\.json/);
    expect(appendedNode.href).toBe('blob:url');
    expect(removeSpy).toHaveBeenCalledWith(appendedNode);
  });
});
