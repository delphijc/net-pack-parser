import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProtocolDistribution } from './ProtocolDistribution';
import type { ParsedPacket } from '../../types';

// Mock Recharts since it doesn't render well in JSDOM
vi.mock('recharts', () => {
  const OriginalValidModule = vi.importActual('recharts');
  return {
    ...OriginalValidModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({ data }: { data: any[] }) => (
      <div data-testid="pie">
        {data.map((entry) => (
          <div key={entry.name} data-testid={`pie-slice-${entry.name}`}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    ),
    Cell: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

describe('ProtocolDistribution', () => {
  const mockPackets: ParsedPacket[] = [
    {
      id: '1',
      protocol: 'TCP',
      detectedProtocols: ['HTTP', 'TCP'],
      timestamp: 1234567890,
    } as ParsedPacket,
    {
      id: '2',
      protocol: 'UDP',
      detectedProtocols: ['DNS', 'UDP'],
      timestamp: 1234567890,
    } as ParsedPacket,
    {
      id: '3',
      protocol: 'TCP',
      detectedProtocols: ['TCP'],
      timestamp: 1234567890,
    } as ParsedPacket,
  ];

  it('renders protocol distribution correctly', () => {
    // Expected distribution: TCP: 2, HTTP: 1, UDP: 1, DNS: 1
    // Logic in component: iterates detectedProtocols.
    // Packet 1: HTTP, TCP
    // Packet 2: DNS, UDP
    // Packet 3: TCP
    // Total: TCP=2, HTTP=1, UDP=1, DNS=1

    render(<ProtocolDistribution packets={mockPackets} />);

    expect(screen.getByText('TCP: 2')).toBeInTheDocument();
    expect(screen.getByText('HTTP: 1')).toBeInTheDocument();
    expect(screen.getByText('UDP: 1')).toBeInTheDocument();
    expect(screen.getByText('DNS: 1')).toBeInTheDocument();
  });

  it('handles packets without detectedProtocols', () => {
    const packets = [
      {
        id: '1',
        protocol: 'TCP',
        detectedProtocols: [], // Empty
        timestamp: 1234567890,
      } as ParsedPacket,
    ];

    render(<ProtocolDistribution packets={packets} />);
    expect(screen.getByText('TCP: 1')).toBeInTheDocument();
  });

  it('renders no data message when empty', () => {
    render(<ProtocolDistribution packets={[]} />);
    expect(screen.getByText(/No protocol data available/i)).toBeInTheDocument();
  });
});
