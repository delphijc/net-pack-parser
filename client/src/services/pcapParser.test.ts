

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseNetworkData } from './pcapParser';

// Mock the database service
vi.mock('./database', () => ({
    default: {
        storePacket: vi.fn(),
        storePackets: vi.fn(),
        updateFileReference: vi.fn(),
        storeTimelineEvent: vi.fn(),
    }
}));

// Mock pcap-decoder
vi.mock('pcap-decoder', () => {
    return {
        default: class {
            constructor() { }
            decode() {
                return [
                    {
                        header: {
                            timestampSeconds: 1620000000,
                            timestampMicroseconds: 0,
                            capturedLength: 60,
                            originalLength: 60
                        },
                        data: new Uint8Array([0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00, 0x40, 0x06, 0xb1, 0xe6, 0xc0, 0xa8, 0x00, 0x68, 0xc0, 0xa8, 0x00, 0x01])
                    }
                ];
            }
        }
    };
});

describe('pcapParser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should parse string data correctly', async () => {
        const input = 'GET / HTTP/1.1\nHost: example.com';
        const result = await parseNetworkData(input);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0].protocol).toBe('HTTP');
        expect(result[0].rawData).toBe(input);
        expect(result[0].tokens.length).toBeGreaterThan(0);
    });

    it('should parse PCAP binary data correctly', async () => {
        // Create a mock ArrayBuffer
        const buffer = new ArrayBuffer(100);
        const result = await parseNetworkData(buffer);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);

        expect(result[0].protocol).toBeDefined();
        expect(result[0].source).toBeDefined();
        expect(result[0].destination).toBeDefined();
    });

    it('should detect file references in string data', async () => {
        const input = 'GET https://example.com/files/document.pdf HTTP/1.1';
        const result = await parseNetworkData(input);

        expect(result[0].fileReferences.length).toBeGreaterThan(0);
        expect(result[0].fileReferences[0].fileName).toBe('document.pdf');
    });
});
