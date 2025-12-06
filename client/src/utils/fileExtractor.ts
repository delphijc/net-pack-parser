// client/src/utils/fileExtractor.ts

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import type { ParsedPacket } from '../types';
import type { FileReference } from '../types/fileReference';

/**
 * Utility for detecting and reassembling files from network packets.
 */
export class FileExtractor {
  private static HTTP_FILE_CONTENT_TYPES = [
    /^application\//,
    /^image\//,
    /^video\//,
    /^audio\//,
    /^font\//,
    /^text\/(?!html|css|javascript|plain)/, // Exclude common text formats that aren't typically "files" to download
  ];

  private ftpControlToDataPort = new Map<string, number>();

  private getControlKey(packet: ParsedPacket): string {
    if (packet.destPort === 21)
      return `${packet.sourceIP}:${packet.sourcePort}`;
    if (packet.sourcePort === 21) return `${packet.destIP}:${packet.destPort}`;
    return '';
  }

  /**
   * Parses HTTP headers from a raw HTTP response string.
   * @param httpResponseString The raw HTTP response as a string.
   * @returns An object containing parsed headers.
   */
  private parseHttpHeaders(httpResponseString: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const headerLines = httpResponseString.split('\r\n');
    for (let i = 1; i < headerLines.length; i++) {
      // Start from second line to skip status line
      const line = headerLines[i];
      if (line.trim() === '') break; // End of headers
      const parts = line.split(':');
      if (parts.length > 1) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        headers[key.toLowerCase()] = value;
      }
    }
    return headers;
  }

  /**
   * Detects file references within a given packet's raw data.
   * @param packet The parsed network packet.
   * @param rawData The raw data (payload) of the packet.
   * @returns An array of detected FileReference objects.
   */
  public detectFileReferences(
    packet: ParsedPacket,
    rawData: Uint8Array,
  ): FileReference[] {
    const detectedFiles: FileReference[] = [];
    const payloadString = new TextDecoder().decode(rawData);

    // HTTP File Detection (based on response headers)
    if (packet.protocol === 'HTTP' && payloadString.startsWith('HTTP/')) {
      const headers = this.parseHttpHeaders(payloadString);
      const contentType = headers['content-type'];
      const contentDisposition = headers['content-disposition'];
      const contentLength = parseInt(headers['content-length'] || '0', 10);

      let filename: string | undefined;

      // Prioritize filename from Content-Disposition
      if (contentDisposition) {
        const filenameMatch = /filename\*?=['"]?(?:UTF-8''|)([^;"]+)['"]?/.exec(
          contentDisposition,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // If no filename from Content-Disposition, try to infer from URL or generic
      if (!filename && contentType) {
        // Simple inference for now, could be improved with URL parsing from request
        filename = `unknown_file.${contentType.split('/')[1] || 'bin'}`;
      }

      // Check if content type matches file types we want to extract
      const isFileContentType =
        contentType &&
        FileExtractor.HTTP_FILE_CONTENT_TYPES.some((regex) =>
          regex.test(contentType),
        );

      if (filename && isFileContentType && contentLength > 0) {
        const fileData = rawData.slice(payloadString.indexOf('\r\n\r\n') + 4); // Extract body after headers

        detectedFiles.push({
          id: uuidv4(),
          filename: filename,
          size: contentLength,
          mimeType: contentType || 'application/octet-stream',
          sourcePacketId: packet.id,
          data: new Blob([fileData], {
            type: contentType || 'application/octet-stream',
          }),
          sha256Hash: '', // Will be calculated later
        });
      }
    }

    // FTP File Detection
    // We detect STOR (upload) and RETR (download) commands on the control channel.
    // Note: Actual file data is transferred on a separate data channel.
    // For this iteration, we capture the metadata from the control channel.
    // Reassembly of data channel streams is a future enhancement.
    // FTP File Detection
    if (
      packet.protocol === 'FTP' ||
      packet.destPort === 21 ||
      packet.sourcePort === 21
    ) {
      const key = this.getControlKey(packet);
      if (key) {
        // Check for PORT command (Client -> Server)
        const portMatch = payloadString.match(
          /PORT\s+(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)/,
        );
        if (portMatch) {
          const p1 = parseInt(portMatch[5], 10);
          const p2 = parseInt(portMatch[6], 10);
          const port = p1 * 256 + p2;
          this.ftpControlToDataPort.set(key, port);
        }

        // Check for PASV response (Server -> Client)
        const pasvMatch = payloadString.match(
          /227.*\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/,
        );
        if (pasvMatch) {
          const p1 = parseInt(pasvMatch[5], 10);
          const p2 = parseInt(pasvMatch[6], 10);
          const port = p1 * 256 + p2;
          this.ftpControlToDataPort.set(key, port);
        }

        const ftpCommandMatch = payloadString.match(/(STOR|RETR)\s+([^\r\n]+)/);
        if (ftpCommandMatch) {
          const command = ftpCommandMatch[1] as 'STOR' | 'RETR';
          const filename = ftpCommandMatch[2].trim();
          const dataPort = this.ftpControlToDataPort.get(key);
          console.log(
            `FTP command detected: ${command} for file: ${filename} in packet ${packet.id}, Data Port: ${dataPort}`,
          );

          detectedFiles.push({
            id: uuidv4(),
            filename: filename,
            size: 0, // Unknown size at this point
            mimeType: 'application/octet-stream', // Default for FTP
            sourcePacketId: packet.id,
            data: new Blob([], { type: 'application/octet-stream' }), // Empty blob for now
            sha256Hash: '', // Will be calculated if we can reassemble
            ftpDataPort: dataPort,
            ftpTransferType: command,
          });
        }
      }
    }

    return detectedFiles;
  }

  /**
   * Reassembles a file from a collection of packets based on a FileReference.
   * @param packets All available parsed packets.
   * @param fileReference The FileReference object describing the file to reassemble.
   * @returns A Promise resolving to the reassembled FileReference with its 'data' field populated.
   */
  public async reassembleFile(
    packets: ParsedPacket[],
    fileReference: FileReference,
  ): Promise<FileReference> {
    if (!fileReference.sourcePacketId) {
      console.error('FileReference missing sourcePacketId for reassembly.');
      return fileReference;
    }

    const chunks: Uint8Array[] = [];

    if (fileReference.ftpDataPort) {
      // FTP Reassembly
      const sourcePacket = packets.find(
        (sp) => sp.id === fileReference.sourcePacketId,
      );
      const startTime = sourcePacket ? sourcePacket.timestamp : 0;

      const relevantPackets = packets
        .filter(
          (p) =>
            (p.sourcePort === fileReference.ftpDataPort ||
              p.destPort === fileReference.ftpDataPort) &&
            p.timestamp >= startTime,
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      for (const packet of relevantPackets) {
        chunks.push(new Uint8Array(packet.rawData));
      }
    } else {
      // HTTP Reassembly
      const relevantPackets = packets
        .filter(
          (p) =>
            p.protocol === 'HTTP' &&
            p.sessionId ===
              packets.find((sp) => sp.id === fileReference.sourcePacketId)
                ?.sessionId,
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      for (const packet of relevantPackets) {
        let currentPacketData = new Uint8Array(packet.rawData);
        // For HTTP, extract body after headers
        if (packet.protocol === 'HTTP') {
          const payloadString = new TextDecoder().decode(currentPacketData);
          const headerEndIndex = payloadString.indexOf('\r\n\r\n');
          if (headerEndIndex !== -1) {
            currentPacketData = currentPacketData.slice(headerEndIndex + 4);
          }
        }
        chunks.push(currentPacketData);
      }
    }

    const fileBlob = new Blob(chunks as BlobPart[], {
      type: fileReference.mimeType,
    });
    const sha256Hash = await this.calculateSha256(fileBlob);

    return {
      ...fileReference,
      data: fileBlob,
      sha256Hash: sha256Hash,
    };
  }

  /**
   * Calculates the SHA-256 hash of a Blob or ArrayBuffer.
   * @param data The Blob or ArrayBuffer to hash.
   * @returns A Promise resolving to the SHA-256 hash as a hexadecimal string.
   */
  private async calculateSha256(data: Blob | ArrayBuffer): Promise<string> {
    const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hexHash;
  }
}

export default new FileExtractor();
