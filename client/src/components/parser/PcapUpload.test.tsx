import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import PcapUpload from './PcapUpload';
import * as pcapParser from '../../services/pcapParser';
import database from '../../services/database';
import { ParsedPacket } from '../../types';
import '@testing-library/jest-dom';

// Mock lucide-react components
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Terminal: vi.fn(() => <svg data-testid="Terminal" />),
    Send: vi.fn(() => <svg data-testid="Send" />),
    AlertTriangle: vi.fn(() => <svg data-testid="AlertTriangle" />),
    Loader2: vi.fn(() => <svg data-testid="Loader2" />),
    Upload: vi.fn(() => <svg data-testid="Upload" />),
    Wifi: vi.fn(() => <svg data-testid="Wifi" />),
    StopCircle: vi.fn(() => <svg data-testid="StopCircle" />),
    Play: vi.fn(() => <svg data-testid="Play" />),
    History: vi.fn(() => <svg data-testid="History" />), // Also mock History for ChainOfCustodyLog
    CheckCircle: vi.fn(() => <svg data-testid="CheckCircle" />), // For FileInfo
    XCircle: vi.fn(() => <svg data-testid="XCircle" />), // For FileInfo
    RefreshCw: vi.fn(() => <svg data-testid="RefreshCw" />), // For FileInfo
  };
});

// Mock dependencies
vi.mock('../../services/pcapParser', () => ({
  parseNetworkData: vi.fn(),
  downloadFile: vi.fn(),
}));

vi.mock('../../services/networkCapture', () => ({
  startNetworkCapture: vi.fn(),
  stopNetworkCapture: vi.fn(),
}));

vi.mock('../../services/database', () => ({
  default: {
    storePacket: vi.fn(),
    storePackets: vi.fn(),
    updateFileReference: vi.fn(),
  },
}));

vi.mock('../../services/api', () => ({
  api: {
    uploadPcap: vi.fn(),
    getStatus: vi.fn(),
    getResults: vi.fn(),
  },
}));

vi.mock('@/services/chainOfCustodyDb', () => ({
  default: {
    addFileChainOfCustodyEvent: vi.fn(() => Promise.resolve()),
    getAllFileChainOfCustodyEvents: vi.fn(() => Promise.resolve([])),
  },
}));

describe('PcapUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<PcapUpload />);
    expect(screen.getByText('Parse Network Data')).toBeInTheDocument();
    expect(screen.getByText('Upload PCAP')).toBeInTheDocument();
  });

  it('handles text input parsing', async () => {
    const mockPacket = {
      id: '123',
      timestamp: new Date().toISOString(),
      source: '192.168.1.1',
      destination: '192.168.1.2',
      protocol: 'HTTP',
      rawData: 'GET / HTTP/1.1',
      tokens: [],
      sections: [],
      fileReferences: [],
      suspiciousIndicators: [],
    } as unknown as ParsedPacket;

    vi.mocked(pcapParser.parseNetworkData).mockResolvedValue([mockPacket]);

    render(<PcapUpload />);

    const textarea = screen.getByLabelText('Enter Network Data to Parse');
    fireEvent.change(textarea, { target: { value: 'GET / HTTP/1.1' } });

    const parseButton = screen.getByText('Parse Data');
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(pcapParser.parseNetworkData).toHaveBeenCalledWith(
        'GET / HTTP/1.1',
      );
      expect(database.storePackets).toHaveBeenCalledWith([mockPacket]);
      expect(
        screen.getByText('Successfully Parsed Packet'),
      ).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    const mockPacket = {
      id: '456',
      timestamp: new Date().toISOString(),
      source: '10.0.0.1',
      destination: '10.0.0.2',
      protocol: 'TCP',
      rawData: 'Binary Data',
      tokens: [],
      sections: [],
      fileReferences: [],
      suspiciousIndicators: [],
    } as unknown as ParsedPacket;

    // Mock API responses
    const { api } = await import('../../services/api');
    vi.mocked(api.uploadPcap).mockResolvedValue({
      sessionId: 'test-session',
      status: 'processing', // "pending" is invalid
      originalName: 'test.pcap',
      size: 1024,
    });
    vi.mocked(api.getStatus).mockResolvedValue({
      status: 'complete',
      progress: 100,
      packetCount: 1,
    });
    vi.mocked(api.getResults).mockResolvedValue({
      sessionId: 'test-session',
      status: 'complete',
      summary: { packetCount: 1, totalBytes: 100 }, // removed duration/protocolBreakdown
      packets: [
        {
          id: '456',
          timestamp: mockPacket.timestamp, // Ensure timestamp matches expected adapted packet
          sourceIp: '10.0.0.1',
          destIp: '10.0.0.2',
          protocol: 'TCP',
          length: 100,
          info: 'Test packet',
          raw: 'Binary Data',
        },
      ],
    });

    const { container } = render(<PcapUpload />);

    const file = new File(['dummy content'], 'test.pcap', {
      type: 'application/vnd.tcpdump.pcap',
    });

    // Find the hidden file input
    const fileInput = container.querySelector('input[type="file"]');

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(
        () => {
          // Correct expectation: Local parser is NOT called for file upload anymore
          expect(pcapParser.parseNetworkData).not.toHaveBeenCalled();
          // Database storage IS called with adapted packets
          expect(database.storePackets).toHaveBeenCalled();
          expect(
            screen.getByText('Successfully Parsed Packet'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    } else {
      throw new Error('File input not found');
    }
  });
});
