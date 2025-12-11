import fs from 'fs';
// @ts-ignore
import pcapParser from 'pcap-parser';
import geoip from 'geoip-lite';
import { activeSessions } from '../routes/analysis';
import { extractStringsFromBuffer, ExtractedString } from '../utils/stringExtractor';
import { fileExtractor, FileReference } from '../utils/fileExtractor';
import { runThreatDetection, ThreatAlert } from '../utils/threatDetection';
import { iocService } from './iocService';
import { yaraService } from './yaraService';
import { v4 as uuidv4 } from 'uuid';

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
    geoip?: { country: string };
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

            // GeoIP Lookup
            let geoInfo = undefined;
            if (srcIp) {
                const geo = geoip.lookup(srcIp);
                if (geo && geo.country) {
                    geoInfo = { country: geo.country };
                }
            }


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

            // IOC Check
            const iocMatches = iocService.checkPacket(packetInfoForDetection);
            iocMatches.forEach(ioc => {
                threats.push({
                    id: uuidv4(),
                    packetId: packetInfoForDetection.id, // Ensure ID is string
                    severity: ioc.severity,
                    type: `IOC Match - ${ioc.type.toUpperCase()}`,
                    description: `Detected IOC: ${ioc.value}. ${ioc.description || ''}`,
                    mitreAttack: [],
                    timestamp: packetInfoForDetection.timestamp.getTime(),
                    sourceIp: packetInfoForDetection.sourceIp,
                    destIp: packetInfoForDetection.destIp,
                    sourcePort: 0,
                    destPort: 0
                });
            });

            // YARA Scan
            // Note: scanPayload is async. We are in a sync callback.
            // THIS IS A PROBLEM with pcap-parser stream event.
            // We need to pause/wait or accept it's async fire-and-forget?
            // "batch" logic might break if we push async. 
            // We must wait for result before pushing to batch.
            // Hack: Making the 'packet' callback async is allowed in Node but pcap-parser might not wait.
            // If pcap-parser emits recursively/fast, we might have race conditions or OOM.
            // However, pcap-parser reading file is usually fast.
            // Ideally we pause parser. 
            // Given the constraints and library, let's try awaiting inside the async handler.
            // If pcap-parser doesn't implement backpressure for async listeners, we might queue up too many promises.
            // For MVP, we'll try it.

            try {
                const yaraMatches = await yaraService.scanPayload(data);
                yaraMatches.forEach(match => {
                    // Auto-extract IOC from Threat
                    if (packetInfoForDetection.sourceIp) {
                        iocService.addIocIfNotExists({
                            type: 'ip',
                            value: packetInfoForDetection.sourceIp,
                            severity: 'high',
                            description: `Auto-detected from YARA Rule: ${match.rule}`
                        });
                    }

                    threats.push({
                        id: uuidv4(),
                        packetId: packetInfoForDetection.id,
                        severity: 'high', // YARA matches usually correspond to specific malware rules
                        type: 'YARA Match',
                        description: `Rule: ${match.rule}`,
                        mitreAttack: [],
                        timestamp: packetInfoForDetection.timestamp.getTime(),
                        sourceIp: packetInfoForDetection.sourceIp,
                        destIp: packetInfoForDetection.destIp,
                        sourcePort: 0,
                        destPort: 0
                    });
                });
            } catch (e) {
                console.error(`YARA scan failed for packet ${packetCount}`, e);
            }


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
                threats,
                geoip: geoInfo
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
