import type { PacketData } from '../types/WebSocketMessages';
import { useLiveStore } from '../store/liveStore';
import type { ParsedPacket } from '../types';
import { detectIOCs } from '../utils/iocDetector';
import type { ThreatAlert } from '../types/threat';
import { alertManager } from './AlertManager';

class LiveProcessor {
    private worker: Worker | null = null;

    constructor() {
        if (typeof Worker !== 'undefined') {
            this.worker = new Worker(
                new URL('../workers/threatWorker.ts', import.meta.url),
                { type: 'module' }
            );

            this.worker.onmessage = (e) => {
                const { id, threats } = e.data as { id: string, threats: ThreatAlert[] };
                if (threats && threats.length > 0) {
                    this.handleThreats(id, threats);
                }
            };
        }
    }

    public process(packet: PacketData) {
        // 1. Send to Worker for Regex Detection (Async)
        if (this.worker && packet.payload) {
            this.worker.postMessage({ id: packet.id, packet });
        }

        // 2. Run IOC Detection (Sync / Main Thread)
        // We need a mock packet for IOCs too
        const mockPacket = this.toParsedPacket(packet);
        detectIOCs(mockPacket).then(iocThreats => {
            if (iocThreats.length > 0) {
                this.handleThreats(packet.id, iocThreats);
            }
        }).catch(err => console.error(err));
    }

    private handleThreats(packetId: string, newThreats: ThreatAlert[]) {
        const severities: ThreatAlert['severity'][] = ['info', 'low', 'medium', 'high', 'critical'];
        const highestSeverity = newThreats.reduce((max, curr) => {
            return severities.indexOf(curr.severity) > severities.indexOf(max) ? curr.severity : max;
        }, 'info' as ThreatAlert['severity']);

        let storeSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (highestSeverity !== 'info') {
            storeSeverity = highestSeverity;
        }

        // Trigger UI Alerts
        newThreats.forEach(threat => alertManager.trigger(threat));

        useLiveStore.getState().updatePacket(packetId, {
            severity: storeSeverity,
        });
    }

    private toParsedPacket(packet: PacketData): ParsedPacket {
        // Minimal conversion for IOC check
        return {
            id: packet.id,
            timestamp: packet.timestamp,
            protocol: packet.protocol,
            sourceIP: packet.sourceIP,
            destIP: packet.destinationIP || '',
            sourcePort: packet.sourcePort,
            destPort: packet.destinationPort,
            length: packet.length,
            info: packet.summary,
            rawData: new ArrayBuffer(0), // IOC mainly checks IPs/Domains not payload usually
            detectedProtocols: [packet.protocol],
            suspiciousIndicators: [],
            tokens: [],
            sections: [],
            fileReferences: [],
            // Add IOC relevant fields if possible (dnsQuery etc need parsing which we don't do fully here yet)
            // But IP check works.
        };
    }
}

export const liveProcessor = new LiveProcessor();
