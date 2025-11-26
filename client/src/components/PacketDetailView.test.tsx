import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PacketDetailView from './PacketDetailView';
import type { ParsedPacket } from '@/types';
import { decodePacketHeaders } from '@/utils/packetDecoder'; // Mock this
import { generateHexDump } from './HexDumpViewer'; // Mock this

// Mock the packetDecoder module
vi.mock('@/utils/packetDecoder', () => ({
  decodePacketHeaders: vi.fn(),
}));

// Mock the HexDumpViewer component and its generateHexDump function
vi.mock('./HexDumpViewer', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./HexDumpViewer')>();
  return {
    ...mod,
    default: ({ rawData }: { rawData: ArrayBuffer }) => ( // Changed to 'default'
      <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap" data-testid="mock-hex-dump-viewer">
        {rawData ? 'MOCKED HEX DUMP CONTENT' : 'NO RAW DATA'}
      </pre>
    ),
    generateHexDump: vi.fn(), // Still mock the utility function
  };
});

// Mock the shadcn/ui sheet component to simplify testing (it renders a div)
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: any) => (
    <div data-testid="mock-sheet" className={open ? 'open' : 'closed'}>
      <button onClick={() => onOpenChange(false)}>Close</button>
      {children}
    </div>
  ),
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <header>{children}</header>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
  SheetFooter: ({ children }: any) => <footer>{children}</footer>,
}));

// Mock the shadcn/ui button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

// Mock the navigator.clipboard API
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Mock TextEncoder for jsdom environment
class MockTextEncoder {
  encode(input: string) {
    const arr = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      arr[i] = input.charCodeAt(i);
    }
    return arr;
  }
}
vi.stubGlobal('TextEncoder', MockTextEncoder);

describe('PacketDetailView', () => {
  const mockPacketWithRawData: ParsedPacket = {
    id: '1',
    timestamp: '2023-03-15T13:20:00.000Z',
    source: '192.168.1.1',
    destination: '192.168.1.100',
    protocol: 'TCP',
    rawData: 'some raw data', // String representation
    tokens: [],
    sections: [],
    fileReferences: []
  };

  const mockPacketNoRawData: ParsedPacket = {
    id: '2',
    timestamp: '2023-03-15T13:20:00.000Z',
    source: '10.0.0.1',
    destination: '10.0.0.2',
    protocol: 'UDP',
    rawData: '',
    tokens: [],
    sections: [],
    fileReferences: []
  };

  const mockDecodedHeaders = [
    { name: 'Ethernet - Source MAC', value: 'aa:bb:cc:dd:ee:ff' },
    { name: 'IP - Source IP', value: '192.168.1.1' },
    { name: 'TCP - Source Port', value: 12345 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (decodePacketHeaders as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockDecodedHeaders);
    (generateHexDump as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      fullHexDump: 'mock hex dump',
      fullAsciiDump: 'mock ascii dump',
    });
  });

  it('renders null if no packet is provided', () => {
    const { container } = render(<PacketDetailView packet={null} isOpen={true} onOpenChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders packet summary information correctly', () => {
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Packet Details')).toBeInTheDocument();
    expect(screen.getByText('ID: 1')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    // Check for locale string format or part of it
    expect(screen.getByText(/2023/)).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getAllByText('192.168.1.1').length).toBeGreaterThan(0);
    expect(screen.getByText('Destination')).toBeInTheDocument();
    expect(screen.getAllByText('192.168.1.100').length).toBeGreaterThan(0);
    expect(screen.getByText('Protocol')).toBeInTheDocument();
    expect(screen.getByText('TCP')).toBeInTheDocument();
    expect(screen.getByText('Length')).toBeInTheDocument();
    // Length is byte length of "some raw data" (13 bytes)
    expect(screen.getByText('13 bytes')).toBeInTheDocument();
  });

  it('renders decoded headers correctly', () => {
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Decoded Headers')).toBeInTheDocument();
    expect(screen.getByText('Ethernet - Source MAC')).toBeInTheDocument();
    expect(screen.getByText('aa:bb:cc:dd:ee:ff')).toBeInTheDocument();
    expect(screen.getByText('IP - Source IP')).toBeInTheDocument();
    expect(screen.getAllByText('192.168.1.1').length).toBeGreaterThan(0);
    expect(screen.getByText('TCP - Source Port')).toBeInTheDocument();
    expect(screen.getByText('12345')).toBeInTheDocument();

    // Expect called with the converted packet structure
    expect(decodePacketHeaders).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      protocol: 'TCP'
    }));
  });

  it('renders HexDumpViewer when raw data is present', () => {
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Payload Hex Dump / ASCII')).toBeInTheDocument();
    const hexDumpViewer = screen.getByText('Payload Hex Dump / ASCII').nextElementSibling;
    expect(hexDumpViewer).toBeInTheDocument();
    expect(hexDumpViewer).toHaveTextContent('MOCKED HEX DUMP CONTENT');
  });

  it('renders HexDumpViewer with monospace font styling', () => {
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={vi.fn()} />);

    const hexDumpViewerElement = screen.getByTestId('mock-hex-dump-viewer');
    expect(hexDumpViewerElement).toHaveClass('font-mono');
  });

  it('displays "No payload data available" when no raw data is present', () => {
    render(<PacketDetailView packet={mockPacketNoRawData} isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Payload Hex Dump / ASCII')).toBeInTheDocument();
    expect(screen.getByText('No payload data available.')).toBeInTheDocument();
    expect(screen.queryByText(/0000/)).not.toBeInTheDocument();
  });

  it('calls onOpenChange when the close button is clicked', () => {
    const handleOpenChange = vi.fn();
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={handleOpenChange} />);

    fireEvent.click(screen.getByText('Close'));
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('copies hex dump to clipboard when "Copy Hex" button is clicked', async () => {
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Copy Hex'));

    await waitFor(() => {
      expect(generateHexDump).toHaveBeenCalledWith(expect.any(ArrayBuffer));
      expect(mockWriteText).toHaveBeenCalledWith('mock hex dump');
    });
  });

  it('copies ASCII dump to clipboard when "Copy ASCII" button is clicked', async () => {
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Copy ASCII'));

    await waitFor(() => {
      expect(generateHexDump).toHaveBeenCalledWith(expect.any(ArrayBuffer));
      expect(mockWriteText).toHaveBeenCalledWith('mock ascii dump');
    });
  });

  it('disables copy buttons when no raw data is present', () => {
    render(<PacketDetailView packet={mockPacketNoRawData} isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Copy Hex')).toBeDisabled();
    expect(screen.getByText('Copy ASCII')).toBeDisabled();
  });

  it('downloads packet data when "Download" button is clicked', () => {
    render(<PacketDetailView packet={mockPacketWithRawData} isOpen={true} onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Download'));

    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.any(Blob)
    );
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('disables download button when no raw data is present', () => {
    render(<PacketDetailView packet={mockPacketNoRawData} isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Download')).toBeDisabled();
  });
});