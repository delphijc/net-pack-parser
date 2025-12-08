import fs from 'fs';
// @ts-ignore
import pcapParser from 'pcap-parser';
import { activeSessions } from '../routes/analysis';
import { extractStringsFromBuffer, ExtractedString } from '../utils/stringExtractor';
import { fileExtractor, FileReference } from '../utils/fileExtractor';
import { runThreatDetection, ThreatAlert } from '../utils/threatDetection';

export interface PacketMetadata {
    id: number;
    timestamp: number;
    sourceIp: string | null;
    destIp: string | null;
    protocol: string;
    length: number;
    info: string;
    raw?: string;
    strings?: ExtractedString[];
    fileReferences?: FileReference[];
    threats?: ThreatAlert[];
}

import { elasticService } from './elasticService';

export const parsePcapFile = (filePath: string, sessionId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        let packetCount = 0;
        let batch: any[] = [];
        const BATCH_SIZE = 500;

        // Create parser
        const parser = pcapParser.parse(filePath);

        parser.on('packet', async (packet: any) => {
            packetCount++;

            // ... (keep existing parsing logic) ...
            const data = packet.data; // This is a Buffer
            let offset = 14;
            let srcIp: string | null = null;
            let dstIp: string | null = null;
            let protocol = 'Unknown';

            try {
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
            } catch (e) { }

            // Extended Analysis
            const packetIdString = `${sessionId}-${packetCount}`;
            // Pass minimal packet info needed for detection context
            const packetInfoForDetection = {
                id: packetIdString,
                timestamp: new Date(packet.header.timestampSeconds * 1000 + (packet.header.timestampMicroseconds / 1000)),
                sourceIp: srcIp,
                destIp: dstIp,
                sourcePort: 0, // Need full parsing for ports, skipping for now
                destPort: 0
            };

            // Extract Strings
            const strings = extractStringsFromBuffer(data, packetIdString);

            // Extract Files
            const fileReferences = fileExtractor.detectFileReferences({
                ...packetInfoForDetection,
                protocol,
                sourcePort: 0, // Placeholder
                destPort: 0 // Placeholder
            }, data);

            // Detect Threats
            const threats = runThreatDetection(packetInfoForDetection, data);


            const meta: any = {
                sessionId,
                timestamp: packetInfoForDetection.timestamp,
                sourceIp: srcIp,
                destIp: dstIp,
                protocol: protocol,
                length: packet.header.capturedLength,
                info: `${protocol} Packet`,
                raw: data.toString('base64'),
                strings,
                fileReferences,
                threats
            };

            batch.push(meta);

            if (batch.length >= BATCH_SIZE) {
                // Determine if we need to pause the parser to avoid OOM?
                // pcap-parser doesn't support easy pause/resume in this event loop style easily without separate stream.
                // For now, we just fire and forget the bulk index promise, or await it if we were async.
                // Since this callback is synchronous in the event emitter, we can't easily await inside it to backpressure.
                // Optimally we would use a Transform stream.

                const flushBatch = [...batch];
                batch = [];
                elasticService.bulkIndexPackets(flushBatch).catch(e => console.error('Index error', e));

                if (activeSessions[sessionId]) {
                    activeSessions[sessionId].progress = packetCount;
                    activeSessions[sessionId].summary.packetCount = packetCount;
                }
            }
        });

        parser.on('end', async () => {
            if (batch.length > 0) {
                await elasticService.bulkIndexPackets(batch);
            }

            if (activeSessions[sessionId]) {
                activeSessions[sessionId].status = 'complete';
                activeSessions[sessionId].summary.packetCount = packetCount;
            }

            resolve();
        });

        parser.on('error', (err: any) => {
            reject(err);
        });
    });
};
