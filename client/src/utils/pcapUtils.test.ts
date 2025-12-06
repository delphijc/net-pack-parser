import { describe, it, expect, vi } from 'vitest';
import { parsePcap } from './pcapUtils';

describe('pcapUtils', () => {
  it('should parse a minimal valid PCAP (Little Endian)', () => {
    // 24 bytes global header + 16 bytes packet header + 4 bytes payload = 44 bytes
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // Global Header
    view.setUint32(0, 0xa1b2c3d4, true); // Magic Number (LE)
    view.setUint16(4, 2, true); // Major Version
    view.setUint16(6, 4, true); // Minor Version
    view.setInt32(8, 0, true); // Thiszone
    view.setUint32(12, 0, true); // Sigfigs
    view.setUint32(16, 65535, true); // Snaplen
    view.setUint32(20, 1, true); // Network (Ethernet)

    // Packet 1 Header
    view.setUint32(24, 1620000000, true); // ts_sec
    view.setUint32(28, 500000, true); // ts_usec
    view.setUint32(32, 4, true); // incl_len
    view.setUint32(36, 60, true); // orig_len

    // Packet 1 Data (4 bytes)
    view.setUint8(40, 0xde);
    view.setUint8(41, 0xad);
    view.setUint8(42, 0xbe);
    view.setUint8(43, 0xef);

    const result = parsePcap(buffer);

    expect(result.globalHeader.magicNumber).toBe(0xa1b2c3d4);
    expect(result.globalHeader.majorVersion).toBe(2);
    expect(result.globalHeader.minorVersion).toBe(4);
    expect(result.packets.length).toBe(1);

    const packet = result.packets[0];
    expect(packet.header.tsSec).toBe(1620000000);
    expect(packet.header.tsUsec).toBe(500000);
    expect(packet.header.inclLen).toBe(4);
    expect(packet.data.byteLength).toBe(4);
    expect(packet.data[0]).toBe(0xde);
    expect(packet.data[3]).toBe(0xef);
  });

  it('should parse a minimal valid PCAP (Big Endian)', () => {
    // 24 bytes global header + 16 bytes packet header + 4 bytes payload = 44 bytes
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // Global Header
    view.setUint32(0, 0xa1b2c3d4, false); // Magic Number (BE) - write as BE, read as BE
    // Note: 0xa1b2c3d4 is the value. If written BE, it is A1 B2 C3 D4 in memory.
    // If read as BE, it is 0xa1b2c3d4.

    view.setUint16(4, 2, false); // Major Version
    view.setUint16(6, 4, false); // Minor Version
    view.setInt32(8, 0, false); // Thiszone
    view.setUint32(12, 0, false); // Sigfigs
    view.setUint32(16, 65535, false); // Snaplen
    view.setUint32(20, 1, false); // Network (Ethernet)

    // Packet 1 Header
    view.setUint32(24, 1620000000, false); // ts_sec
    view.setUint32(28, 500000, false); // ts_usec
    view.setUint32(32, 4, false); // incl_len
    view.setUint32(36, 60, false); // orig_len

    // Packet 1 Data (4 bytes)
    view.setUint8(40, 0xde);
    view.setUint8(41, 0xad);
    view.setUint8(42, 0xbe);
    view.setUint8(43, 0xef);

    const result = parsePcap(buffer);

    expect(result.globalHeader.magicNumber).toBe(0xa1b2c3d4);
    // Since we wrote BE and the parser auto-detects BE, it should read these correctly
    expect(result.globalHeader.majorVersion).toBe(2);
    expect(result.packets.length).toBe(1);
    expect(result.packets[0].header.tsSec).toBe(1620000000);
  });

  it('should throw warning/handle truncated packet body', () => {
    // 24 bytes global header + 16 bytes packet header + 2 bytes payload (truncated, needs 4)
    const buffer = new ArrayBuffer(42);
    const view = new DataView(buffer);

    // Global Header (LE)
    view.setUint32(0, 0xa1b2c3d4, true);
    view.setUint16(4, 2, true);
    view.setUint16(6, 4, true);
    view.setInt32(8, 0, true);
    view.setUint32(12, 0, true);
    view.setUint32(16, 65535, true);
    view.setUint32(20, 1, true);

    // Packet 1 Header
    view.setUint32(24, 1620000000, true);
    view.setUint32(28, 500000, true);
    view.setUint32(32, 4, true); // Claims 4 bytes
    view.setUint32(36, 60, true);

    // Packet 1 Data (only 2 bytes available)
    view.setUint8(40, 0xde);
    view.setUint8(41, 0xad);

    // Should log warning but not throw, effectively skipping the partial packet or stopping (implementation dependent)
    // Current implementation breaks loop on truncation
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = parsePcap(buffer);

    expect(spy).toHaveBeenCalled();
    expect(result.packets.length).toBe(0); // Packet dropped because it was truncated
    spy.mockRestore();
  });

  it('should throw error on invalid magic number', () => {
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    view.setUint32(0, 0x12345678, true); // Invalid magic number

    expect(() => parsePcap(buffer)).toThrow('Invalid PCAP Magic Number');
  });
});
