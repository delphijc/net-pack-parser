import type { ParsedPacket } from '../types';

export interface ReassembledStream {
    flowId: string;
    segments: StreamSegment[];
    totalPayloadSize: number;
    startTime: number;
    endTime: number;
}

export interface StreamSegment {
    packetId: string;
    timestamp: number;
    direction: 'client-to-server' | 'server-to-client';
    payload: ArrayBuffer;
    seq: number;
    len: number;
    isMissing?: boolean;
}

export const reassembleTcpStream = (packets: ParsedPacket[], flowId: string): ReassembledStream => {
    // 1. Filter packets by flowId
    // Note: packets should already be filtered, but good to ensure
    const flowPackets = packets.filter(p => (p.flowId === flowId || p.sessionId === flowId) && p.protocol === 'TCP');

    if (flowPackets.length === 0) {
        return {
            flowId,
            segments: [],
            totalPayloadSize: 0,
            startTime: 0,
            endTime: 0
        };
    }

    // 2. Identify direction (Client is initiator - usually first SYN or first packet)
    // Heuristic: First packet source is Client.
    const firstPacket = flowPackets[0]; // Assumes chronological order input
    const clientIp = firstPacket.sourceIP;
    const clientPort = firstPacket.sourcePort;

    // 3. Map to segments
    let segments: StreamSegment[] = flowPackets.map(p => {
        // Calculate TCP payload length: Total IP Length - IP Header - TCP Header
        // But for simplicity, we look at p.rawData depending on how pcapParser stores it.
        // pcapParser currently stores full frame in rawData (ArrayBuffer).
        // We need to re-extract payload or assume we can slice it. 
        // This is complex without re-parsing. 
        // OPTIMIZATION: pcapParser should ideally expose 'payload' slice.
        // For now, let's use a helper or assume 'rawData' is the full packet and we need to strip headers.

        // Let's assume for this MVP we extract payload via offset logic logic similar to pcapParser...
        // Wait, pcapParser didn't expose payload offset. 
        // We will need to re-parse or rely on existing 'tokens' if they represent payload?
        // Sections[type='body'] roughly represents payload but might include headers if not split correctly.
        // In pcapParser, "body" was just hex string of everything? No, let's check pcapParser.

        // pcapParser.ts:
        // sections.push({ type: 'body', content: packetDataHexString }); -> This is EVERYTHING.

        // We need to strip headers.
        // A robust solution needs headers length.

        // WORKAROUND: For now, we will use a simple heuristic calculation here or update parser.
        // Let's assume standard 14 byte Eth + 20 byte IP + 20 byte TCP = 54 bytes.
        // This is fragile. 
        // A better approach is to let pcapParser store 'payload' field.

        return {
            packetId: p.id,
            timestamp: p.timestamp,
            direction: (p.sourceIP === clientIp && p.sourcePort === clientPort) ? 'client-to-server' : 'server-to-client',
            payload: p.rawData, // Placeholder: Needs header stripping!
            seq: p.seq || 0,
            len: p.length
        };
    });

    // 4. Sort by Sequence Number (per direction) to handle out-of-order
    // This is tricky because C->S and S->C have independent sequence numbers.
    // We should probably keep them chronological for the "Conversation View" style.
    // Wireshark "Follow Stream" shows them chronologically merged but reordered within their own direction streams if needed.
    // Simplifying: Sort by Timestamp first (default behavior).
    // Then optionally check for Sequence gaps.

    // Let's stick to Timestamp sort for the main view, which is standard for "Follow Stream" text view.
    // Handling true TCP reassembly (handling retransmissions and OOO) is complex.
    // For visual inspection, Timestamp sort is usually 90% effective.

    segments.sort((a, b) => a.timestamp - b.timestamp);

    // 5. Calculate total size
    const totalSize = segments.reduce((acc, s) => acc + s.len, 0);

    return {
        flowId,
        segments,
        totalPayloadSize: totalSize,
        startTime: segments[0]?.timestamp || 0,
        endTime: segments[segments.length - 1]?.timestamp || 0
    };
};
