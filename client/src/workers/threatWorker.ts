import type { PacketData } from '../types/WebSocketMessages';
import type { ThreatAlert } from '../types/threat';
import type { ParsedPacket } from '../types';
import { detectSqlInjection } from '../utils/sqlInjectionDetector';
import { detectXss } from '../utils/xssDetector';
// import { detectCommandInjection } from '../utils/commandInjectionDetector';
// import { detectSensitiveData } from '../utils/sensitiveDataDetector';

// Define message format
interface WorkerMessage {
    id: string; // packet ID or request ID
    packet: PacketData;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { id, packet } = e.data;

    // 1. Convert PacketData to ParsedPacket (Mock)
    if (!packet.payload) {
        self.postMessage({ id, threats: [] });
        return;
    }

    // Decode base64 payload to Uint8Array
    const binaryString = atob(packet.payload);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const mockPacket: ParsedPacket = {
        id: packet.id,
        timestamp: packet.timestamp,
        protocol: packet.protocol,
        sourceIP: packet.sourceIP,
        destIP: packet.destinationIP || '', // WS uses destinationIP, ParsedPacket uses destIP
        sourcePort: packet.sourcePort,
        destPort: packet.destinationPort,
        length: packet.length,
        info: packet.summary,
        rawData: bytes.buffer, // Essential for detectors (some use ArrayBuffer)
        detectedProtocols: [packet.protocol], // Approximate
        suspiciousIndicators: [],
        tokens: [],
        sections: [],
        fileReferences: []
    };

    // 2. Run Detectors
    let threats: ThreatAlert[] = [];

    // Add HTTP/HTTPS tag if valid protocol, to ensure SQLi detector runs
    // In PacketParser on server, we might have just put 'TCP'.
    // Better to just force tags for detection if payload looks like HTTP?
    // Or just rely on what we have.
    // For MVP, lets assume 'TCP' might be HTTP. 
    // SQL detector checks `detectedProtocols.includes('HTTP')`.
    // I will forcefully add 'HTTP' if not present, just to try matching?
    // Or simpler: Update mockPacket protocols.
    mockPacket.detectedProtocols.push('HTTP');
    // This assumes all live packets are candidates. Maybe too aggressive?
    // But safe for finding patterns.

    try {
        threats = threats.concat(detectSqlInjection(mockPacket));
        threats = threats.concat(detectXss(mockPacket));
        // threats = threats.concat(detectCommandInjection(mockPacket));
        // threats = threats.concat(detectSensitiveData(mockPacket));
    } catch (err) {
        console.error('Worker detection error', err);
    }

    // 3. Post results
    self.postMessage({ id, threats });
};
