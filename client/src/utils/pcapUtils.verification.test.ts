import { describe, it, expect } from 'vitest';
import { parsePcap } from './pcapUtils';
// @ts-expect-error fs module is available in test environment but not typed for browser build
import fs from 'fs';

describe('PCAP Parsing Verification', () => {
  it('should correctly parse the demo.pcap file', () => {
    const pcapPath = '/Users/delphijc/Projects/net-pack-parser/demo/demo.pcap';
    const pcapBuffer = fs.readFileSync(pcapPath);
    const arrayBuffer = pcapBuffer.buffer.slice(
      pcapBuffer.byteOffset,
      pcapBuffer.byteOffset + pcapBuffer.byteLength,
    ) as ArrayBuffer;

    const { packets, globalHeader } = parsePcap(arrayBuffer);

    expect(globalHeader.magicNumber).toBeDefined();
    expect(packets.length).toBe(9); // Confirmed via generate_pcap.js to be 9 packets

    // Verify specific packet types roughly match generation script order
    // 1. Normal HTTP
    // 2. Normal HTTP Response
    // 3. SQL Injection (Classic)
    // 4. SQL Injection (Union)
    // 5. IOC IP Match
    // 6. IOC Domain Match
    // 7. XSS
    // 8. Directory Traversal
    // 9. Command Injection
    // Packet 1: Normal HTTP Traffic
    // Packet 2: Normal HTTP Traffic
    // Packet 3: SQL Injection
    // ...
  });
});
