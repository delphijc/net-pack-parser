
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineChart } from './TimelineChart';
import type { TimelineDataPoint } from '../types/timeline';

// Mock Recharts to avoid complex DOM testing of SVG
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    Tooltip: () => <div data-testid="tooltip" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Brush: () => <div data-testid="brush" />,
}));

describe('TimelineChart', () => {
    const mockData: TimelineDataPoint[] = [
        { timestamp: 1000, count: 5, threatCount: 0, normalCount: 5 },
        { timestamp: 2000, count: 10, threatCount: 2, normalCount: 8 },
    ];

    it('renders graph components', () => {
        render(<TimelineChart data={mockData} />);

        expect(screen.getByTestId('responsive-container')).toBeDefined();
        expect(screen.getByTestId('bar-chart')).toBeDefined();
        expect(screen.getAllByTestId('bar').length).toBeGreaterThan(0);
        expect(screen.getByTestId('x-axis')).toBeDefined();
        expect(screen.getByTestId('y-axis')).toBeDefined();
    });

    it('renders "No data" message when data is empty', () => {
        render(<TimelineChart data={[]} />);
        expect(screen.getByText(/No timeline data available/i)).toBeDefined();
    });
});
