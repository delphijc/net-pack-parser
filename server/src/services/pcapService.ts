import fs from 'fs';
// @ts-ignore
import pcapParser from 'pcap-parser';
import { activeSessions } from '../routes/analysis';

export interface PacketMetadata {
    id: number;
    timestamp: number;
    sourceIp: string;
    destIp: string;
    protocol: string;
    length: number;
    info: string;
    raw?: string; // Hex string? Or base64?
}

export const parsePcapFile = (filePath: string, sessionId: string): Promise<PacketMetadata[]> => {
    return new Promise((resolve, reject) => {
        const packets: PacketMetadata[] = [];
        let packetCount = 0;

        // Create parser
        const parser = pcapParser.parse(filePath);

        parser.on('packet', (packet: any) => {
            packetCount++;

            // Basic extraction (expand this based on pcap-parser capabilities and requirements)
            // pcap-parser returns raw buffer and header
            // We need a way to decode headers (Ethernet, IP, TCP)
            // Since pcap-parser just gives raw data, we need a decoding library or manual parsing
            // For MVP, likely need 'pcap-parser' just gives the raw buffer.
            // We might need 'packet-decoder' or similar.
            // Wait, the client used `pcap-decoder`. The server can use similar logic or a library like `cap` or `pcap`.
            // `pcap-parser` provides the header and data buffer.

            // For this MVP, let's implement basic extraction if possible, or use a dummy implementation
            // if we don't have a decoder library installed.
            // Actually, I should probably install a decoder. `pcap-decode` or similar.
            // Let's assume for now we extract minimal info or use a decoder.
            // To strictly follow the plan, I should "Implement PCAP parsing logic".
            // I'll add a todo/logic to parse bytes. 
            // User request is to "move processing to backend".

            // Let's attempt to manually parse IPv4/TCP headers from the buffer for the basics
            // or install `network-packet` or similar.
            // Since I didn't install a decoder, I will do manual offset parsing for standard Ethernet/IP.

            const data = packet.data; // Buffer

            // Very naive parsing (Ethernet + IP)
            // Assume Ethernet II
            let offset = 0;

            // Skip Ethernet Header (14 bytes)
            offset += 14;

            // Check if IP (EtherType 0x0800 at offset 12)
            // const etherType = data.readUInt16BE(12);

            // IP Header
            // Version/IHL (1 byte)
            // const versionIhl = data[offset];

            // Extract IP addresses (Src: offset+12, Dst: offset+16)
            // This is fragile without a real decoder library, but sufficient for proof of concept or MVP refactor.

            let srcIp = 'Unknown';
            let dstIp = 'Unknown';
            let protocol = 'Unknown';

            try {
                // Simple IPv4 check
                const etherType = data.readUInt16BE(12);
                if (etherType === 0x0800) {
                    srcIp = `${data[offset + 12]}.${data[offset + 13]}.${data[offset + 14]}.${data[offset + 15]}`;
                    dstIp = `${data[offset + 16]}.${data[offset + 17]}.${data[offset + 18]}.${data[offset + 19]}`;
                    const proto = data[offset + 9];
                    if (proto === 6) protocol = 'TCP';
                    else if (proto === 17) protocol = 'UDP';
                    else if (proto === 1) protocol = 'ICMP';
                    else protocol = `IP(${proto})`;
                }
            } catch (e) {
                // Ignore parse errors for partial packets
            }

            const meta: PacketMetadata = {
                id: packetCount,
                timestamp: packet.header.timestampSeconds * 1000 + (packet.header.timestampMicroseconds / 1000),
                sourceIp: srcIp,
                destIp: dstIp,
                protocol: protocol,
                length: packet.header.capturedLength,
                info: `${protocol} Packet`,
                // Send a limited amount of raw data to save bandwidth? Or full?
                // Let's send hex string for searchability
                // raw: data.toString('hex') 
            };

            packets.push(meta);

            // Periodically update progress
            if (packetCount % 1000 === 0) {
                if (activeSessions[sessionId]) {
                    activeSessions[sessionId].progress = packetCount; // rough progress
                    activeSessions[sessionId].summary.packetCount = packetCount;
                }
            }
        });

        parser.on('end', () => {
            resolve(packets);
        });

        parser.on('error', (err: any) => {
            reject(err);
        });
    });
};
