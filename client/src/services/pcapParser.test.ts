import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseNetworkData } from './pcapParser';

// Mock the database service
vi.mock('./database', () => ({
  default: {
    storePacket: vi.fn(),
    storePackets: vi.fn(),
    updateFileReference: vi.fn(),
    storeTimelineEvent: vi.fn(),
    storeTimelineEvents: vi.fn(),
  },
}));

// Mock pcapUtils
vi.mock('../utils/pcapUtils', () => ({
  parsePcap: vi.fn(() => {
    // Simulate a TCP packet with sourcePort 12345, destPort 80, and TCP protocol
    const mockPacketData = new Uint8Array([
      // Dummy Ethernet Header
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x08,
      0x00,
      // Dummy IPv4 Header (Protocol TCP = 6)
      0x45,
      0x00,
      0x00,
      0x3c,
      0x1c,
      0x46,
      0x40,
      0x00,
      0x40,
      0x06,
      0xb1,
      0xe6,
      0xc0,
      0xa8,
      0x00,
      0x01, // Source IP: 192.168.0.1
      0xc0,
      0xa8,
      0x00,
      0x02, // Destination IP: 192.168.0.2
      // Dummy TCP Header (Source Port 12345, Dest Port 80)
      0x30,
      0x39, // Source Port: 12345 (0x3039)
      0x00,
      0x50, // Dest Port: 80 (0x0050)
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x50,
      0x02,
      0x20,
      0x00,
      0xaf,
      0x0e,
      0x00,
      0x00,
      // Dummy Payload (HTTP GET request)
      0x47,
      0x45,
      0x54,
      0x20,
      0x2f,
      0x20,
      0x48,
      0x54,
      0x54,
      0x50,
      0x2f,
      0x31,
      0x2e,
      0x31,
      0x0d,
      0x0a,
    ]);

    return {
      globalHeader: {
        magicNumber: 0xa1b2c3d4,
        majorVersion: 2,
        minorVersion: 4,
        thiszone: 0,
        sigfigs: 0,
        snaplen: 65535,
        network: 1,
      },
      packets: [
        {
          header: {
            tsSec: 1620000000,
            tsUsec: 0,
            inclLen: mockPacketData.length,
            origLen: mockPacketData.length,
          },
          data: mockPacketData,
        },
      ],
    };
  }),
}));

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
    expect(new TextDecoder().decode(result[0].rawData as ArrayBuffer)).toBe(
      input,
    );
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
    expect(result[0].sourceIP).toBeDefined();
    expect(result[0].destIP).toBeDefined();
  });

  it('should detect file references in string data', async () => {
    const input = 'GET https://example.com/files/document.pdf HTTP/1.1';
    const result = await parseNetworkData(input);

    expect(result[0].fileReferences.length).toBeGreaterThan(0);
    expect(result[0].fileReferences[0].filename).toBe('document.pdf');
  });
});
