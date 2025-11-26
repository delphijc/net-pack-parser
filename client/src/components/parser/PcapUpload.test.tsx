
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import PcapUpload from './PcapUpload';
import * as pcapParser from '../../services/pcapParser';
import database from '../../services/database';

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
    }
}));

describe('PcapUpload Component', () => {
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
            suspiciousIndicators: []
        };

        (pcapParser.parseNetworkData as any).mockResolvedValue([mockPacket]);

        render(<PcapUpload />);

        const textarea = screen.getByLabelText('Enter Network Data to Parse');
        fireEvent.change(textarea, { target: { value: 'GET / HTTP/1.1' } });

        const parseButton = screen.getByText('Parse Data');
        fireEvent.click(parseButton);

        await waitFor(() => {
            expect(pcapParser.parseNetworkData).toHaveBeenCalledWith('GET / HTTP/1.1');
            expect(database.storePackets).toHaveBeenCalledWith([mockPacket]);
            expect(screen.getByText('Successfully Parsed Packet')).toBeInTheDocument();
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
            suspiciousIndicators: []
        };

        (pcapParser.parseNetworkData as any).mockResolvedValue([mockPacket]);

        const { container } = render(<PcapUpload />);

        const file = new File(['dummy content'], 'test.pcap', { type: 'application/vnd.tcpdump.pcap' });
        Object.defineProperty(file, 'arrayBuffer', {
            value: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        });
        // Find the hidden file input
        const fileInput = container.querySelector('input[type="file"]');

        if (fileInput) {
            fireEvent.change(fileInput, { target: { files: [file] } });

            await waitFor(() => {
                expect(pcapParser.parseNetworkData).toHaveBeenCalled();
                expect(database.storePackets).toHaveBeenCalledWith([mockPacket]);
            });
        } else {
            throw new Error('File input not found');
        }
    });
});
