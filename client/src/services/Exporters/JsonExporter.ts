import type { ParsedPacket } from '@/types';
import type { ThreatAlert } from '@/types/threat';

export class JsonExporter {
    private static readonly SCHEMA_VERSION = '1.0';

    public static exportPackets(packets: ParsedPacket[], filename: string = 'packets.json') {
        const data = {
            metadata: {
                version: this.SCHEMA_VERSION,
                exportDate: new Date().toISOString(),
                type: 'packet_export',
                count: packets.length
            },
            packets: packets
        };

        this.downloadJson(data, filename);
    }

    public static exportThreats(threats: ThreatAlert[], filename: string = 'threats.json') {
        const data = {
            metadata: {
                version: this.SCHEMA_VERSION,
                exportDate: new Date().toISOString(),
                type: 'threat_export',
                count: threats.length
            },
            threats: threats
        };

        this.downloadJson(data, filename);
    }

    private static downloadJson(data: any, filename: string) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
}
