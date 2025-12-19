import { PacketData } from '../types/WebSocketMessages';
import { v4 as uuidv4 } from 'uuid';

export class PacketParser {
  static parse(buffer: Buffer, timestamp: number): PacketData | null {
    // Basic parsing for Ethernet II / IPv4
    // TODO: Add support for IPv6, etc.

    try {
      // Ethernet Header (14 bytes)
      // Destination MAC (6), Source MAC (6), EtherType (2)
      const etherType = buffer.readUInt16BE(12);

      let protocol = 'Unknown';
      let sourceIP = 'Unknown';
      let destinationIP = 'Unknown';
      let sourcePort = 0;
      let destinationPort = 0;
      let summary = '';

      // IPv4
      if (etherType === 0x0800) {
        const ipOffset = 14;
        // Version + IHL
        const verIhl = buffer[ipOffset];
        const ihl = (verIhl & 0x0f) * 4; // Header length in bytes

        // Protocol
        const proto = buffer[ipOffset + 9];

        // IPs
        sourceIP = `${buffer[ipOffset + 12]}.${buffer[ipOffset + 13]}.${buffer[ipOffset + 14]}.${buffer[ipOffset + 15]}`;
        destinationIP = `${buffer[ipOffset + 16]}.${buffer[ipOffset + 17]}.${buffer[ipOffset + 18]}.${buffer[ipOffset + 19]}`;

        const transportOffset = ipOffset + ihl;

        if (proto === 6) {
          protocol = 'TCP';
          sourcePort = buffer.readUInt16BE(transportOffset);
          destinationPort = buffer.readUInt16BE(transportOffset + 2);
        } else if (proto === 17) {
          protocol = 'UDP';
          sourcePort = buffer.readUInt16BE(transportOffset);
          destinationPort = buffer.readUInt16BE(transportOffset + 2);
        } else if (proto === 1) {
          protocol = 'ICMP';
        } else {
          protocol = `IP(${proto})`;
        }
      } else if (etherType === 0x86dd) {
        protocol = 'IPv6';
        // IPv6 parsing placeholder
      } else if (etherType === 0x0806) {
        protocol = 'ARP';
      } else {
        protocol = `Eth(${etherType.toString(16)})`;
      }

      summary = `${protocol} ${sourceIP}:${sourcePort} -> ${destinationIP}:${destinationPort}`;

      return {
        id: uuidv4(),
        timestamp,
        protocol,
        sourceIP,
        destinationIP,
        sourcePort,
        destinationPort,
        length: buffer.length,
        summary: `${protocol} ${sourceIP}:${sourcePort} -> ${destinationIP}:${destinationPort}`,
        severity: 'low', // Default severity
        payload:
          buffer.length > 2048
            ? buffer.subarray(0, 2048).toString('base64')
            : buffer.toString('base64'),
      };
    } catch (error) {
      // console.error('Error parsing packet:', error);
      return null;
    }
  }
}
