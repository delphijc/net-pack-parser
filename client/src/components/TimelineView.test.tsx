import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineView } from './TimelineView';
import type { Packet } from '../types/packet';

// Mock dependencies
vi.mock('../utils/timelineUtils', () => ({
  generateTimelineData: vi.fn(() => [
    { timestamp: 1000, count: 5 },
    { timestamp: 2000, count: 3 },
  ]),
}));

vi.mock('./TimelineChart', () => ({
  TimelineChart: ({ data }: any) => (
    <div data-testid="timeline-chart">Chart with {data.length} points</div>
  ),
}));

describe('TimelineView', () => {
  const mockPackets: Packet[] = [
    { id: '1', timestamp: 1000 } as any,
    { id: '2', timestamp: 1000 } as any,
  ];

  it('renders TimelineChart with processed data', () => {
    render(<TimelineView packets={mockPackets} />);

    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
    expect(screen.getByText('Chart with 2 points')).toBeInTheDocument();
  });

  it('handles empty packet list', () => {
    render(<TimelineView packets={[]} />);
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });
});
