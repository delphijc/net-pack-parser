import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import PacketList from './PacketList';
import PacketDetailView from './PacketDetailView'; // The component we want to integrate with
import database from '../services/database'; // Mock this
import type { ParsedPacket } from '../types';

// Mock the database service
vi.mock('../services/database', () => ({
  default: {
    getAllPackets: vi.fn(),
    deletePacket: vi.fn(),
    clearAllData: vi.fn(),
  },
}));

// Mock PacketDetailView to control its rendering and check props
vi.mock('./PacketDetailView', () => ({
  default: vi.fn(({ packet, isOpen, onOpenChange }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-packet-detail-view">
        <h2 data-testid="detail-view-title">Packet Details - ID: {packet?.id}</h2>
        <button onClick={() => onOpenChange(false)}>Close Detail View</button>
      </div>
    );
  }),
}));

describe('PacketList Integration with PacketDetailView', () => {
  const mockPackets: ParsedPacket[] = [
    {
      id: 'packet-1',
      timestamp: '2023-03-15T13:20:00.000Z',
      source: '192.168.1.1',
      destination: '192.168.1.100',
      protocol: 'TCP',
      // length: 100, // ParsedPacket doesn't have length directly usually, but if it does in test it's fine. 
      // Checking types/index.ts, ParsedPacket does NOT have length. It has sections, tokens.
      // But PacketList uses it? PacketList uses packet.protocol, packet.timestamp.
      // PacketList uses packet.destination.
      // PacketList does NOT use packet.length.
      // So I should remove length from mock if it's not in type.
      rawData: 'some raw data 1', // Simplified for this test
      // sourceIP, destIP etc are NOT in ParsedPacket.
      tokens: [],
      sections: [],
      fileReferences: []
    },
    {
      id: 'packet-2',
      timestamp: '2023-03-15T13:20:01.000Z',
      source: '192.168.1.2',
      destination: '192.168.1.101',
      protocol: 'UDP',
      // length: 50,
      rawData: 'some raw data 2', // Simplified for this test
      tokens: [],
      sections: [],
      fileReferences: []
    },
  ];

  // A simple wrapper component to manage the state
  const TestWrapper = () => {
    const [selectedPacket, setSelectedPacket] = useState<ParsedPacket | null>(null);
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

    const handlePacketSelect = (packet: ParsedPacket | null) => {
      setSelectedPacket(packet);
      setIsDetailViewOpen(!!packet); // Open if packet is selected, close if null
    };

    return (
      <>
        <PacketList onPacketSelect={handlePacketSelect} selectedPacketId={selectedPacket?.id || null} disablePolling={true} />
        <PacketDetailView
          packet={selectedPacket}
          isOpen={isDetailViewOpen}
          onOpenChange={setIsDetailViewOpen}
        />
      </>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (database.getAllPackets as Mock).mockReturnValue(mockPackets);
  });

  afterEach(() => {
  });

  it('should render PacketList and initially not show PacketDetailView', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });


    expect(screen.getByText('Captured Packets')).toBeInTheDocument();
    expect(screen.getByText(mockPackets[0].destination)).toBeInTheDocument();
    expect(screen.getByText(mockPackets[1].destination)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-packet-detail-view')).not.toBeInTheDocument();
  });

  it('should open PacketDetailView with correct packet data when a packet is clicked', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });


    fireEvent.click(screen.getByTestId(`packet-item-${mockPackets[0].id}`));

    await waitFor(() => {
      expect(screen.getByTestId('mock-packet-detail-view')).toBeInTheDocument();
      expect(screen.getByTestId('detail-view-title')).toHaveTextContent('Packet Details - ID: packet-1');
    });
  });

  it('should close PacketDetailView when its close button is clicked', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });


    fireEvent.click(screen.getByTestId(`packet-item-${mockPackets[0].id}`));

    await waitFor(() => {
      expect(screen.getByTestId('mock-packet-detail-view')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Detail View'));

    await waitFor(() => {
      expect(screen.queryByTestId('mock-packet-detail-view')).not.toBeInTheDocument();
    });
  });

  it('should clear selected packet and close detail view when "Clear all packets" is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => {
      render(<TestWrapper />);
    });


    fireEvent.click(screen.getByTestId(`packet-item-${mockPackets[0].id}`));
    await waitFor(() => expect(screen.getByTestId('mock-packet-detail-view')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Clear all packets'));
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete all packets?');

    await waitFor(() => {
      expect(database.clearAllData).toHaveBeenCalled();
      expect(screen.queryByTestId('mock-packet-detail-view')).not.toBeInTheDocument();
    });
  });

  it('should clear selected packet and close detail view when selected packet is deleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => {
      render(<TestWrapper />);
    });


    fireEvent.click(screen.getByTestId(`packet-item-${mockPackets[0].id}`));
    await waitFor(() => expect(screen.getByTestId('mock-packet-detail-view')).toBeInTheDocument());

    const packetItem1 = screen.getByTestId(`packet-item-${mockPackets[0].id}`);
    fireEvent.click(within(packetItem1).getByTitle('Delete packet'));

    await waitFor(() => {
      expect(database.deletePacket).toHaveBeenCalledWith('packet-1');
      expect(screen.queryByTestId('mock-packet-detail-view')).not.toBeInTheDocument();
    });
  });
});
