import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilesTab from './FilesTab';
import type { ParsedPacket, FileReference } from '../types';
import DatabaseService from '../services/database';
import ChainOfCustodyDb from '../services/chainOfCustodyDb';

// Mock dependencies
vi.mock('../services/database', () => ({
  default: {
    getFileById: vi.fn(),
  },
}));

vi.mock('../services/chainOfCustodyDb', () => ({
  default: {
    addEvent: vi.fn(),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'mock-url');
globalThis.URL.revokeObjectURL = vi.fn();

describe('FilesTab', () => {
  const mockFileRef: FileReference = {
    id: 'file-1',
    filename: 'test.txt',
    size: 1024,
    mimeType: 'text/plain',
    sourcePacketId: 'packet-1',
    data: new Blob(['test content'], { type: 'text/plain' }),
    sha256Hash: 'hash123',
  };

  const mockPacket: ParsedPacket = {
    id: 'packet-1',
    timestamp: Date.now(),
    sourceIP: '192.168.1.1',
    destIP: '192.168.1.2',
    sourcePort: 1234,
    destPort: 80,
    protocol: 'HTTP',
    length: 100,
    rawData: new ArrayBuffer(100),
    tokens: [],
    sections: [],
    fileReferences: [mockFileRef],
    detectedProtocols: ['HTTP'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (DatabaseService.getFileById as any).mockResolvedValue(mockFileRef);
    (ChainOfCustodyDb.addEvent as any).mockResolvedValue('event-id');
  });

  it('renders detected files', async () => {
    render(<FilesTab packet={mockPacket} />);

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeDefined();
      expect(screen.getByText('1 KB')).toBeDefined(); // 1024 bytes
      expect(screen.getByText('text/plain')).toBeDefined();
      expect(screen.getByText('hash123')).toBeDefined();
    });
  });

  it('handles file download', async () => {
    render(<FilesTab packet={mockPacket} />);

    await waitFor(() => expect(screen.getByText('Download')).toBeDefined());

    const downloadBtn = screen.getByText('Download');
    fireEvent.click(downloadBtn);

    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(
      mockFileRef.data,
    );
    // Verify Chain of Custody logging
    expect(ChainOfCustodyDb.addEvent).toHaveBeenCalled();
  });

  it('displays message when no files detected', () => {
    const packetNoFiles = { ...mockPacket, fileReferences: [] };
    render(<FilesTab packet={packetNoFiles} />);
    expect(
      screen.getByText('No file references detected for this packet.'),
    ).toBeDefined();
  });
});
