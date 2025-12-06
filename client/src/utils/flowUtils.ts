import type { ParsedPacket } from '../types';

export interface Flow {
  id: string; // Composite key
  startTime: number;
  endTime: number;
  duration: number; // in ms
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  protocol: string;
  packetCount: number;
  totalBytes: number;
  packets: ParsedPacket[];
  info?: string; // Preview of payload
}

/**
 * Aggregates packets into 5-tuple flows.
 * Handles bidirectional aggregation by canonicalizing the IP/Port pair.
 */
export const aggregateFlows = (packets: ParsedPacket[]): Flow[] => {
  const flows = new Map<string, Flow>();

  packets.forEach((packet) => {
    const srcIp = packet.sourceIP || 'Unknown';
    const dstIp = packet.destIP || 'Unknown';
    const srcPort = packet.sourcePort || 0;
    const dstPort = packet.destPort || 0;
    const proto = packet.protocol || 'Unknown';
    const length = packet.length || 0;

    // Packet timestamp is in ms, we want seconds for consistency with PCAP tools or maintain precision.
    // FlowList expects seconds (multiplies by 1000 for Date).
    const ts = packet.timestamp ? packet.timestamp / 1000 : Date.now() / 1000;

    // Canonicalize key for bidirectional flow
    let key = '';
    if (srcIp < dstIp) {
      key = `${srcIp}:${srcPort}-${dstIp}:${dstPort}-${proto}`;
    } else if (srcIp > dstIp) {
      key = `${dstIp}:${dstPort}-${srcIp}:${srcPort}-${proto}`;
    } else {
      if (srcPort < dstPort) {
        key = `${srcIp}:${srcPort}-${dstIp}:${dstPort}-${proto}`;
      } else {
        key = `${dstIp}:${dstPort}-${srcIp}:${srcPort}-${proto}`;
      }
    }

    if (!flows.has(key)) {
      flows.set(key, {
        id: key,
        startTime: ts,
        endTime: ts,
        duration: 0,
        sourceIp: srcIp,
        sourcePort: srcPort,
        destIp: dstIp,
        destPort: dstPort,
        protocol: proto,
        packetCount: 0,
        totalBytes: 0,
        packets: [],
        info: '',
      });
    }

    const flow = flows.get(key)!;
    flow.packetCount++;
    flow.totalBytes += length;
    flow.packets.push(packet);

    // Update times
    if (ts < flow.startTime) flow.startTime = ts;
    if (ts > flow.endTime) flow.endTime = ts;
    // duration in ms? Flow interface said "in ms".
    // If ts is seconds, diff is seconds.
    // Let's keep ts in SECONDS for start/end, but calculate duration in MS?
    // Or store everything in ms?
    // FlowList says: new Date(flow.startTime * 1000) -> expects Seconds.
    // FlowList says: flow.duration > 1000 ? ...s : ...ms. implies MS.
    flow.duration = (flow.endTime - flow.startTime) * 1000;

    // Update Info (simple preview)
    if (!flow.info && packet.rawData && packet.rawData.byteLength > 0) {
      // Try to extract useful info/preview
      // Just a placeholder logic for now
      flow.info = `Len: ${packet.rawData.byteLength}`;
    }
  });

  return Array.from(flows.values()).sort((a, b) => a.startTime - b.startTime);
};
