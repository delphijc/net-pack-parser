import type { Packet } from '@/types/packet';

export interface DecodedHeader {
  name: string;
  value: string | number;
  description?: string; // Optional: for more context
}

// Helper to format MAC addresses
function formatMacAddress(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':');
}

// Helper to format IPv4 addresses
function formatIPv4Address(bytes: Uint8Array): string {
  return Array.from(bytes).join('.');
}

// Helper for TCP flags
function getTcpFlags(byte: number): string[] {
  const flags = [];
  if (byte & 0x01) flags.push('FIN');
  if (byte & 0x02) flags.push('SYN');
  if (byte & 0x04) flags.push('RST');
  if (byte & 0x08) flags.push('PSH');
  if (byte & 0x10) flags.push('ACK');
  if (byte & 0x20) flags.push('URG');
  if (byte & 0x40) flags.push('ECE'); // ECN-Echo
  if (byte & 0x80) flags.push('CWR'); // Congestion Window Reduced
  return flags;
}

export function decodePacketHeaders(packet: Packet): DecodedHeader[] {
  const headers: DecodedHeader[] = [];
  if (!packet.rawData || packet.rawData.byteLength === 0) {
    return [{ name: 'Error', value: 'No raw data available' }];
  }

  const dataView = new DataView(packet.rawData);
  let offset = 0;
  let etherType = 0;

  // --- Ethernet Header (14 bytes) ---
  // https://en.wikipedia.org/wiki/Ethernet_frame#Ethernet_II_frame
  if (packet.rawData.byteLength >= offset + 14) {
    const destMac = new Uint8Array(packet.rawData, offset, 6);
    offset += 6;
    const srcMac = new Uint8Array(packet.rawData, offset, 6);
    offset += 6;
    etherType = dataView.getUint16(offset, false); // Network byte order (big-endian)
    offset += 2;

    headers.push({
      name: 'Ethernet - Destination MAC',
      value: formatMacAddress(destMac),
    });
    headers.push({
      name: 'Ethernet - Source MAC',
      value: formatMacAddress(srcMac),
    });
    headers.push({
      name: 'Ethernet - EtherType',
      value: `0x${etherType.toString(16).padStart(4, '0')}`,
      description: getEtherTypeDescription(etherType),
    });
  } else {
    headers.push({ name: 'Ethernet Header', value: 'Incomplete or missing' });
    return headers; // Cannot proceed without full Ethernet header
  }

  // --- IP Header (assuming IPv4 for now, 20-60 bytes) ---
  // https://en.wikipedia.org/wiki/IPv4#Header
  // EtherType for IPv4 is 0x0800
  const ETHERTYPE_IPV4 = 0x0800;
  if (
    etherType === ETHERTYPE_IPV4 &&
    packet.rawData.byteLength >= offset + 20
  ) {
    const ipVersionIhl = dataView.getUint8(offset);
    const ipVersion = (ipVersionIhl >> 4) & 0x0f;
    const ipHeaderLength = (ipVersionIhl & 0x0f) * 4; // In bytes

    if (ipVersion === 4) {
      // Only handle IPv4 for now
      // const dscpEcn = dataView.getUint8(offset + 1); // Unused
      const totalLength = dataView.getUint16(offset + 2, false);
      const identification = dataView.getUint16(offset + 4, false);
      // const flagsFragmentOffset = dataView.getUint16(offset + 6, false); // Unused
      const ttl = dataView.getUint8(offset + 8);
      const ipProtocol = dataView.getUint8(offset + 9);
      const headerChecksum = dataView.getUint16(offset + 10, false);
      const srcIp = new Uint8Array(packet.rawData, offset + 12, 4);
      const destIp = new Uint8Array(packet.rawData, offset + 16, 4);

      headers.push({ name: 'IP - Version', value: ipVersion });
      headers.push({
        name: 'IP - Header Length',
        value: `${ipHeaderLength} bytes`,
      });
      headers.push({
        name: 'IP - Total Length',
        value: `${totalLength} bytes`,
      });
      headers.push({
        name: 'IP - Identification',
        value: `0x${identification.toString(16).padStart(4, '0')}`,
      });
      headers.push({ name: 'IP - TTL', value: ttl });
      headers.push({
        name: 'IP - Protocol',
        value: `${ipProtocol}`,
        description: getIpProtocolDescription(ipProtocol),
      });
      headers.push({
        name: 'IP - Header Checksum',
        value: `0x${headerChecksum.toString(16).padStart(4, '0')}`,
      });
      headers.push({ name: 'IP - Source IP', value: formatIPv4Address(srcIp) });
      headers.push({
        name: 'IP - Destination IP',
        value: formatIPv4Address(destIp),
      });

      offset += ipHeaderLength; // Move offset past IP header

      // --- Transport Layer Header ---
      if (packet.rawData.byteLength >= offset) {
        switch (ipProtocol) {
          case 6: // TCP
            if (packet.rawData.byteLength >= offset + 20) {
              // Minimum TCP header length
              const srcPort = dataView.getUint16(offset, false);
              const destPort = dataView.getUint16(offset + 2, false);
              const sequenceNumber = dataView.getUint32(offset + 4, false);
              const acknowledgmentNumber = dataView.getUint32(
                offset + 8,
                false,
              );
              const dataOffsetReservedFlags = dataView.getUint16(
                offset + 12,
                false,
              );
              const tcpHeaderLength =
                ((dataOffsetReservedFlags >> 12) & 0x0f) * 4; // In bytes
              const flags = getTcpFlags(dataOffsetReservedFlags & 0x1ff); // Last 9 bits are flags
              const windowSize = dataView.getUint16(offset + 14, false);
              const checksum = dataView.getUint16(offset + 16, false);
              const urgentPointer = dataView.getUint16(offset + 18, false);

              headers.push({ name: 'TCP - Source Port', value: srcPort });
              headers.push({ name: 'TCP - Destination Port', value: destPort });
              headers.push({
                name: 'TCP - Sequence Number',
                value: sequenceNumber,
              });
              headers.push({
                name: 'TCP - Acknowledgment Number',
                value: acknowledgmentNumber,
              });
              headers.push({
                name: 'TCP - Header Length',
                value: `${tcpHeaderLength} bytes`,
              });
              headers.push({
                name: 'TCP - Flags',
                value: flags.join(', ') || 'None',
              });
              headers.push({ name: 'TCP - Window Size', value: windowSize });
              headers.push({
                name: 'TCP - Checksum',
                value: `0x${checksum.toString(16).padStart(4, '0')}`,
              });
              headers.push({
                name: 'TCP - Urgent Pointer',
                value: urgentPointer,
              });
            } else {
              headers.push({
                name: 'TCP Header',
                value: 'Incomplete or missing',
              });
            }
            break;
          case 17: // UDP
            if (packet.rawData.byteLength >= offset + 8) {
              // UDP header length
              const srcPort = dataView.getUint16(offset, false);
              const destPort = dataView.getUint16(offset + 2, false);
              const length = dataView.getUint16(offset + 4, false);
              const checksum = dataView.getUint16(offset + 6, false);

              headers.push({ name: 'UDP - Source Port', value: srcPort });
              headers.push({ name: 'UDP - Destination Port', value: destPort });
              headers.push({ name: 'UDP - Length', value: `${length} bytes` });
              headers.push({
                name: 'UDP - Checksum',
                value: `0x${checksum.toString(16).padStart(4, '0')}`,
              });
            } else {
              headers.push({
                name: 'UDP Header',
                value: 'Incomplete or missing',
              });
            }
            break;
          case 1: // ICMP
            headers.push({
              name: 'ICMP',
              value: 'Decoded (basic)',
              description: 'Further ICMP decoding to be implemented',
            });
            break;
          default:
            headers.push({
              name: 'Transport Layer',
              value: `Unknown Protocol (${ipProtocol})`,
            });
            break;
        }
      }
    } else {
      headers.push({
        name: 'IP Header',
        value: `Unsupported IP Version ${ipVersion}`,
      });
    }
  } else if (etherType === ETHERTYPE_IPV4) {
    headers.push({ name: 'IP Header', value: 'Incomplete or missing' });
  }

  return headers;
}

// Helper functions for descriptions
function getEtherTypeDescription(etherType: number): string {
  switch (etherType) {
    case 0x0800:
      return 'IPv4';
    case 0x0806:
      return 'ARP';
    case 0x86dd:
      return 'IPv6';
    default:
      return 'Unknown';
  }
}

function getIpProtocolDescription(ipProtocol: number): string {
  switch (ipProtocol) {
    case 1:
      return 'ICMP';
    case 6:
      return 'TCP';
    case 17:
      return 'UDP';
    case 50:
      return 'ESP (IPsec)';
    case 51:
      return 'AH (IPsec)';
    default:
      return 'Unknown';
  }
}
