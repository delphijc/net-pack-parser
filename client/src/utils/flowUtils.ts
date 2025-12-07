import type { Packet, ParsedPacket } from '../types';

export interface Flow {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  protocol: string;
  packetCount: number;
  totalBytes: number;
  packets: ParsedPacket[];
}

export const generateFlowId = (packet: Packet): string => {
  const { sourceIP, destIP, sourcePort, destPort, protocol } = packet;

  // Sort IPs to handle bidirectional flow
  const [ip1, ip2] = [sourceIP, destIP].sort();

  // Sort Ports to handle bidirectional flow
  const [port1, port2] = [sourcePort, destPort].sort((a, b) => a - b);

  return `${protocol}-${ip1}:${port1}-${ip2}:${port2}`;
};

export const aggregateFlows = (packets: ParsedPacket[]): Flow[] => {
  const flowsMap = new Map<string, Flow>();

  packets.forEach((packet) => {
    // Use existing flowId from packet if available, otherwise generate it
    // Note: pcapParser now assigns flowId, so it should be there.
    // Fallback just in case of old packets or different source.
    const flowId = packet.flowId || generateFlowId(packet);

    if (!flowsMap.has(flowId)) {
      flowsMap.set(flowId, {
        id: flowId,
        startTime: packet.timestamp,
        endTime: packet.timestamp, // Initialize with same
        duration: 0,
        sourceIp: packet.sourceIP,
        sourcePort: packet.sourcePort,
        destIp: packet.destIP,
        destPort: packet.destPort,
        protocol: packet.protocol,
        packetCount: 0,
        totalBytes: 0,
        packets: [],
      });
    }

    const flow = flowsMap.get(flowId)!;
    flow.packetCount++;
    flow.totalBytes += packet.length;
    flow.packets.push(packet);

    // Update time range
    if (packet.timestamp < flow.startTime) flow.startTime = packet.timestamp;
    if (packet.timestamp > flow.endTime) flow.endTime = packet.timestamp;

    flow.duration = flow.endTime - flow.startTime;
  });

  return Array.from(flowsMap.values()).sort((a, b) => b.startTime - a.startTime);
};
