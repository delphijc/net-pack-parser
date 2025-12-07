import JSZip from 'jszip';
import type { ParsedPacket } from '@/types';
import type { ThreatAlert } from '@/types/threat';

export class EvidenceExporter {
    public static async exportPacketsWithIntegrity(
        packets: ParsedPacket[],
        format: 'csv' | 'json',
        baseFilename: string
    ) {
        const { content, extension } = this.generateContent(packets, format, 'packets');
        await this.createAndDownloadZip(content, `${baseFilename}.${extension}`, baseFilename);
    }

    public static async exportThreatsWithIntegrity(
        threats: ThreatAlert[],
        format: 'csv' | 'json',
        baseFilename: string
    ) {
        const { content, extension } = this.generateContent(threats, format, 'threats');
        await this.createAndDownloadZip(content, `${baseFilename}.${extension}`, baseFilename);
    }

    private static generateContent(
        data: any[],
        format: 'csv' | 'json',
        type: 'packets' | 'threats'
    ): { content: string; extension: string; mimeType: string } {
        if (format === 'json') {
            const jsonStructure = {
                metadata: {
                    version: '1.0',
                    exportDate: new Date().toISOString(),
                    type: `${type}_export`,
                    count: data.length,
                },
                [type]: data,
            };
            return {
                content: JSON.stringify(jsonStructure, null, 2),
                extension: 'json',
                mimeType: 'application/json',
            };
        } else {
            // Re-use logic from CsvExporter but we need it to return string instead of downloading
            // I'll need to refactor CsvExporter slightly or duplicate logic. 
            // Duplicating for safety/speed now, refactor later if huge.
            // Actually, CsvExporter's logic is simple enough to inline or basic helper.
            let headers: string[] = [];
            let rows: string[][] = [];

            if (type === 'packets') {
                headers = ['Time', 'Source IP', 'Dest IP', 'Protocol', 'Length', 'Info'];
                rows = (data as ParsedPacket[]).map(packet => {
                    const time = new Date(packet.timestamp).toISOString();
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
            } else {
                headers = ['Packet ID', 'Type', 'Severity', 'Description', 'Timestamp', 'Source IP', 'Dest IP'];
                rows = (data as ThreatAlert[]).map(threat => [
                    threat.packetId,
                    threat.type,
                    threat.severity,
                    threat.description,
                    new Date(threat.timestamp).toISOString(),
                    threat.sourceIp || '',
                    threat.destIp || ''
                ]);
            }

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => this.escapeCsvCell(cell)).join(','))
            ].join('\n');

            return {
                content: csvContent,
                extension: 'csv',
                mimeType: 'text/csv;charset=utf-8;',
            };
        }
    }

    private static escapeCsvCell(cell: string): string {
        if (cell === null || cell === undefined) {
            return '';
        }
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
    }

    private static async createAndDownloadZip(
        content: string,
        filename: string,
        zipName: string
    ) {
        const zip = new JSZip();

        // Add the main file
        zip.file(filename, content);

        // Calculate Hash
        const hash = await this.calculateSHA256(content);

        // Add Verification File
        const verificationContent = `Filename: ${filename}
SHA-256: ${hash}
Generated: ${new Date().toISOString()}
Note: This hash verifies the integrity of the exported file.`;

        zip.file(`${filename}.sha256.txt`, verificationContent);

        // Generate ZIP blob
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Download
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${zipName}_evidence.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    private static async calculateSHA256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
}
