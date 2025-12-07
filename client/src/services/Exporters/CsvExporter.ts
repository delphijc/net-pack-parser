import type { ParsedPacket } from '@/types';
import type { ThreatAlert } from '@/types/threat';

export class CsvExporter {
    public static exportPackets(packets: ParsedPacket[], filename: string = 'packets.csv') {
        const headers = ['Time', 'Source IP', 'Dest IP', 'Protocol', 'Length', 'Info'];

        const rows = packets.map(packet => {
            const time = new Date(packet.timestamp).toISOString();
            // Info column approximation since we don't have a dedicated info field in ParsedPacket yet
            // We can construct something useful or use existing fields.
            const info = `${packet.protocol} ${packet.length} bytes`;

            return [
                time,
                packet.sourceIP,
                packet.destIP,
                packet.protocol,
                packet.length.toString(),
                info
            ];
        });

        this.downloadCsv(headers, rows, filename);
    }

    public static exportThreats(threats: ThreatAlert[], filename: string = 'threats.csv') {
        const headers = ['Packet ID', 'Type', 'Severity', 'Description', 'Timestamp', 'Source IP', 'Dest IP'];

        const rows = threats.map(threat => [
            threat.packetId,
            threat.type,
            threat.severity,
            threat.description,
            new Date(threat.timestamp).toISOString(),
            threat.sourceIp || '',
            threat.destIp || ''
        ]);

        this.downloadCsv(headers, rows, filename);
    }

    public static exportPerformanceMetrics(history: any[], filename: string = 'performance_metrics.csv') {
        const headers = ['Timestamp', 'MetricName', 'Value'];
        const rows: string[][] = [];

        history.forEach(point => {
            const time = new Date(point.timestamp).toISOString();

            // Add Score
            rows.push([time, 'Score', point.score.toString()]);

            // Add other metrics
            Object.entries(point.metrics).forEach(([key, value]) => {
                rows.push([time, key, (value as number).toString()]);
            });
        });

        this.downloadCsv(headers, rows, filename);
    }

    private static downloadCsv(headers: string[], rows: string[][], filename: string) {
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => this.escapeCsvCell(cell)).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    private static escapeCsvCell(cell: string): string {
        if (cell === null || cell === undefined) {
            return '';
        }
        const cellStr = cell.toString();
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
    }
}
