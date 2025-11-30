// client/src/components/PacketDetailView.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PacketDetailView from './PacketDetailView'; // Default import
import type { ParsedPacket } from '@/types';
import type { ThreatAlert } from '../types/threat';
import HexDumpViewer from '@/components/HexDumpViewer'; // Import the actual component

// Mock the HexDumpViewer to inspect its props
vi.mock('@/components/HexDumpViewer', () => ({
  __esModule: true,
  default: vi.fn(() => <div>Mock HexDumpViewer</div>),
  generateHexDump: vi.fn(() => ({
    lines: [],
    fullAsciiDump: '',
  })),
}));

// Mock the ThreatPanel to inspect its props
vi.mock('./ThreatPanel', () => ({
  ThreatPanel: vi.fn(({ threats }) => (
    <div>
      Mock ThreatPanel ({threats.length} threats)
      {threats.map((t: ThreatAlert) => (
        <div key={t.id}>{t.description}</div>
      ))}
    </div>
  )),
}));

// Mock threatDetectionUtils
vi.mock('../utils/threatDetectionUtils', () => ({
  getThreatHighlightRanges: vi.fn((threats) => {
    return threats.flatMap((t: ThreatAlert) => t.matchDetails || []);
  }),
}));

describe('PacketDetailView', () => {
  const mockPacket: ParsedPacket = {
    id: 'packet-test-1',
    timestamp: Date.now(),
    sourceIP: '192.168.1.1',
    destIP: '192.168.1.100',
    sourcePort: 12345,
    destPort: 80,
    protocol: 'TCP',
    length: 50,
    rawData: new TextEncoder().encode(
      'GET /index.html HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer,
    detectedProtocols: ['HTTP'],
    // Added for ParsedPacket
    tokens: [],
    sections: [],
    fileReferences: [],
  };

  const mockThreats: ThreatAlert[] = [
    {
      id: 'threat-1',
      packetId: 'packet-test-1',
      severity: 'critical',
      type: 'SQL Injection',
      description: 'Potential SQL Injection detected',
      mitreAttack: ['T1190'],
      timestamp: Date.now(),
      falsePositive: false,
      confirmed: false,
      matchDetails: [{ offset: 10, length: 5 }], // Highlight "index"
    },
  ];

  it('renders packet details correctly', () => {
    render(
      <PacketDetailView
        packet={mockPacket}
        isOpen={true}
        onOpenChange={vi.fn()}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    expect(screen.getByText('Packet Details')).toBeInTheDocument();
    expect(screen.getByText(/ID:/)).toBeInTheDocument();
    expect(screen.getByText(/packet-test-1/)).toBeInTheDocument();
    expect(screen.getAllByText(/Source/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/192.168.1.1/)[0]).toBeInTheDocument();
  });

  it('displays Hex Dump tab content by default', () => {
    render(
      <PacketDetailView
        packet={mockPacket}
        isOpen={true}
        onOpenChange={vi.fn()}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    expect(screen.getByText('Payload Hex Dump / ASCII')).toBeInTheDocument();
    expect(HexDumpViewer).toHaveBeenCalled();
  });

  it('switches to Extracted Strings tab', () => {
    render(
      <PacketDetailView
        packet={mockPacket}
        isOpen={true}
        onOpenChange={vi.fn()}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /Extracted Strings/i }));
    expect(screen.getByText('Extracted Strings')).toBeInTheDocument();
    // Assuming ExtractedStringsTab renders something distinct
  });

  it('displays the Threats tab and its content', async () => {
    render(
      <PacketDetailView
        packet={mockPacket}
        isOpen={true}
        onOpenChange={vi.fn()}
        threats={mockThreats}
        onUpdateThreatStatus={vi.fn()}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Threats/i }));

    expect(
      await screen.findByText(/Mock ThreatPanel/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/1 threats/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Potential SQL Injection detected'),
    ).toBeInTheDocument();
  });


  it('passes correct highlightRanges to HexDumpViewer for threats', async () => {
    render(
      <PacketDetailView
        packet={mockPacket}
        isOpen={true}
        onOpenChange={vi.fn()}
        threats={mockThreats}
        onUpdateThreatStatus={vi.fn()}
      />,
    );

    // Switch to Hex Dump tab to ensure HexDumpViewer is rendered
    fireEvent.click(screen.getByRole('tab', { name: /Hex Dump \/ ASCII/i }));

    await waitFor(() => {
      expect(HexDumpViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          highlightRanges: expect.arrayContaining([
            { offset: 10, length: 5 }, // From mockThreats[0].matchDetails
          ]),
        }),
        undefined,
      );
    });
  });

  it('does not pass threat highlightRanges if no threats are provided', async () => {
    render(
      <PacketDetailView
        packet={mockPacket}
        isOpen={true}
        onOpenChange={vi.fn()}
        threats={[]}
        onUpdateThreatStatus={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /Hex Dump \/ ASCII/i }));

    await waitFor(() => {
      expect(HexDumpViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          highlightRanges: [], // Should be empty without threats
        }),
        undefined,
      );
    });
  });
});
