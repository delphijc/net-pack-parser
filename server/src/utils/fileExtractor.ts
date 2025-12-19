import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface FileReference {
  id: string;
  filename?: string;
  size: number;
  mimeType: string;
  sourcePacketId: string; // The ID of the packet where detection occurred
  // data: Buffer; // For now we won't store the full file content in ES to save space, maybe just metadata?
  // Actually, storing small files (<1MB) in ES as base64 is okay. For larger, we'd need a separate store (S3/Disk).
  // Let's store up to a limit.
  dataOffset?: number; // Where in the raw packet does it start?
  sha256Hash?: string;
  ftpDataPort?: number;
  ftpTransferType?: 'STOR' | 'RETR';
}

export class FileExtractor {
  private static HTTP_FILE_CONTENT_TYPES = [
    /^application\//,
    /^image\//,
    /^video\//,
    /^audio\//,
    /^font\//,
    /^text\/(?!html|css|javascript|plain)/,
  ];

  private ftpControlToDataPort = new Map<string, number>();

  private getControlKey(packet: any): string {
    // packet.sourceIp / destIp are verified to be strings now or null.
    // If null return empty
    if (!packet.sourceIp || !packet.destIp) return '';

    if (packet.destPort === 21)
      return `${packet.sourceIp}:${packet.sourcePort}`;
    if (packet.sourcePort === 21) return `${packet.destIp}:${packet.destPort}`;
    return '';
  }

  private parseHttpHeaders(httpResponseString: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const headerLines = httpResponseString.split('\r\n');
    for (let i = 1; i < headerLines.length; i++) {
      const line = headerLines[i];
      if (line.trim() === '') break;
      const parts = line.split(':');
      if (parts.length > 1) {
        const key = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(':').trim();
        headers[key] = value;
      }
    }
    return headers;
  }

  public detectFileReferences(packet: any, rawData: Buffer): FileReference[] {
    const detectedFiles: FileReference[] = [];
    const payloadString = rawData.toString('utf-8'); // Expensive for large packets?

    // HTTP
    if (packet.protocol === 'HTTP' && payloadString.startsWith('HTTP/')) {
      const headers = this.parseHttpHeaders(payloadString);
      const contentType = headers['content-type'];
      const contentDisposition = headers['content-disposition'];
      const contentLength = parseInt(headers['content-length'] || '0', 10);

      let filename: string | undefined;

      if (contentDisposition) {
        const filenameMatch = /filename\*?=['"]?(?:UTF-8''|)([^;"]+)['"]?/.exec(
          contentDisposition,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      if (!filename && contentType) {
        filename = `unknown_file.${contentType.split('/')[1] || 'bin'}`;
      }

      const isFileContentType =
        contentType &&
        FileExtractor.HTTP_FILE_CONTENT_TYPES.some((regex) =>
          regex.test(contentType),
        );

      if (filename && isFileContentType && contentLength > 0) {
        const headerEndIndex = rawData.indexOf('\r\n\r\n');
        if (headerEndIndex !== -1) {
          // We found a file!
          // We verify size matches logic?
          detectedFiles.push({
            id: uuidv4(),
            filename: filename,
            size: contentLength,
            mimeType: contentType || 'application/octet-stream',
            sourcePacketId: String(packet.id),
            dataOffset: headerEndIndex + 4,
          });
        }
      }
    }

    // FTP
    if (
      packet.protocol === 'FTP' ||
      packet.destPort === 21 ||
      packet.sourcePort === 21
    ) {
      const key = this.getControlKey(packet);
      if (key) {
        // Check PORT
        const portMatch = payloadString.match(
          /PORT\s+(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)/,
        );
        if (portMatch) {
          const p1 = parseInt(portMatch[5], 10);
          const p2 = parseInt(portMatch[6], 10);
          const port = p1 * 256 + p2;
          this.ftpControlToDataPort.set(key, port);
        }

        // PASV
        const pasvMatch = payloadString.match(
          /227.*\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/,
        );
        if (pasvMatch) {
          const p1 = parseInt(pasvMatch[5], 10);
          const p2 = parseInt(pasvMatch[6], 10);
          const port = p1 * 256 + p2;
          this.ftpControlToDataPort.set(key, port);
        }

        // STOR/RETR
        const ftpCommandMatch = payloadString.match(/(STOR|RETR)\s+([^\r\n]+)/);
        if (ftpCommandMatch) {
          const command = ftpCommandMatch[1] as 'STOR' | 'RETR';
          const filename = ftpCommandMatch[2].trim();
          const dataPort = this.ftpControlToDataPort.get(key);

          detectedFiles.push({
            id: uuidv4(),
            filename,
            size: 0,
            mimeType: 'application/octet-stream',
            sourcePacketId: String(packet.id),
            ftpDataPort: dataPort,
            ftpTransferType: command,
          });
        }
      }
    }

    return detectedFiles;
  }
}

export const fileExtractor = new FileExtractor();
