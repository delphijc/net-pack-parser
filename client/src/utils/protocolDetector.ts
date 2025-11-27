// client/src/utils/protocolDetector.ts

import type { Packet } from '../types/packet';

/**
 * Detects protocols based on packet data using a multi-layered approach:
 * 1. Port-based heuristics (Fastest, common protocols)
 * 2. IP Header analysis (Network layer protocols)
 * 3. Deep Packet Inspection (DPI) (Content-based verification)
 * 
 * @param packet The packet object containing metadata like ports and protocol ID.
 * @param payload The raw payload data of the packet as a Uint8Array.
 * @returns An array of detected protocol strings (e.g., ['TCP', 'HTTP']).
 */
export function detectProtocols(packet: Packet, payload: Uint8Array): string[] {
  const detected: string[] = [];

  let portBasedProtocol: string | undefined;

  const { sourcePort, destPort } = packet;

  // ---------------------------------------------------------------------------
  // 1. Port-based heuristics
  // ---------------------------------------------------------------------------
  // Identify common application protocols based on well-known IANA port numbers.
  // This is the primary and fastest method for initial classification but can be
  // spoofed if services run on non-standard ports.
  if (sourcePort === 80 || destPort === 80 || sourcePort === 8080 || destPort === 8080) {
    portBasedProtocol = 'HTTP';
  } else if (sourcePort === 443 || destPort === 443) {
    portBasedProtocol = 'HTTPS';
  } else if (sourcePort === 53 || destPort === 53) {
    portBasedProtocol = 'DNS';
  } else if (sourcePort === 20 || destPort === 20 || sourcePort === 21 || destPort === 21) {
    portBasedProtocol = 'FTP';
  } else if (sourcePort === 22 || destPort === 22) {
    portBasedProtocol = 'SSH';
  } else if (sourcePort === 23 || destPort === 23) {
    portBasedProtocol = 'TELNET';
  } else if (sourcePort === 25 || destPort === 25) {
    portBasedProtocol = 'SMTP';
  } else if (sourcePort === 110 || destPort === 110) {
    portBasedProtocol = 'POP3';
  } else if (sourcePort === 143 || destPort === 143) {
    portBasedProtocol = 'IMAP';
  } else if (sourcePort === 3389 || destPort === 3389) {
    portBasedProtocol = 'RDP';
  }

  if (portBasedProtocol) {
    detected.push(portBasedProtocol);
  }

  // ---------------------------------------------------------------------------
  // 2. IP header protocol field detection
  // ---------------------------------------------------------------------------
  // Classify network-layer protocols (TCP, UDP, ICMP) derived from the IP header.
  // This provides the transport layer context.
  const networkProtocol = packet.protocol.toUpperCase();
  if (['TCP', 'UDP', 'ICMP'].includes(networkProtocol) && !detected.includes(networkProtocol)) {
    detected.push(networkProtocol);
  }

  // ---------------------------------------------------------------------------
  // 3. Deep Packet Inspection (DPI)
  // ---------------------------------------------------------------------------

  // DPI for HTTP:
  // Inspect the first few bytes of the payload for standard HTTP methods or version strings.
  // This allows detection of HTTP traffic even when running on non-standard ports.
  // We check for 'GET', 'POST', 'PUT', 'HEAD', and 'HTTP'.
  if (payload.length > 3) {
    const payloadStart = new TextDecoder().decode(payload.slice(0, 4));
    if (
      (payloadStart.startsWith('GET') ||
        payloadStart.startsWith('POST') ||
        payloadStart.startsWith('PUT') ||
        payloadStart.startsWith('HEAD') ||
        payloadStart.startsWith('HTTP')) &&
      !detected.includes('HTTP')
    ) {
      detected.push('HTTP');
    }
  }

  // DPI for DNS:
  // DNS typically runs over UDP on port 53.
  // A standard DNS header is 12 bytes long. We verify the transport protocol (UDP),
  // the port (53), and that the payload is at least the size of a header.
  // Future enhancement: Parse the DNS header flags (QR, Opcode) for stricter validation.
  if (
    (sourcePort === 53 || destPort === 53) &&
    networkProtocol === 'UDP' &&
    payload.length >= 12 && // Minimum DNS message size (12 bytes for header)
    !detected.includes('DNS')
  ) {
    detected.push('DNS');
  }

  // ---------------------------------------------------------------------------
  // 4. Fallback / Uncertain Detection
  // ---------------------------------------------------------------------------
  // If no specific application or transport protocol could be confidently identified,
  // label it as 'Unknown' and include the destination port to aid manual analysis.
  if (detected.length === 0) {
    detected.push(`Unknown (Port ${destPort})`);
  }

  return detected;
}
