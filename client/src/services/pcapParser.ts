import { extractStrings } from '../utils/stringExtractor';
import { detectProtocols } from '../utils/protocolDetector'; // Import detectProtocols
import type { ParsedPacket, Token, ParsedSection } from '../types';
import type { FileReference } from '../types/fileReference'; // Corrected FileReference import
import fileExtractor from '../utils/fileExtractor'; // Import fileExtractor
import { v4 as uuidv4 } from 'uuid';
import database from './database';
import {
  analyzeSuspiciousIndicators,
  checkThreatIntelligence,
  createForensicMetadata,
  createTimelineEvent,
} from '../utils/analysis';

// @ts-ignore
import PcapDecoder from 'pcap-decoder';

/**
 * Parses network traffic data into tokens and strings
 */
/**
 * Parses network traffic data into tokens and strings
 */
export const parseNetworkData = async (
  data: string | ArrayBuffer,
): Promise<ParsedPacket[]> => {
  // Check if the data is a PCAP file (starts with magic number)
  if (data instanceof ArrayBuffer) {
    return parsePcapData(data);
  }

  // Fallback to string parsing for text input
  return [parseStringData(data)];
};

/**
 * Browser-compatible PCAP parser implementation using pcap-decoder
 */
const parsePcapData = async (data: ArrayBuffer): Promise<ParsedPacket[]> => {
  const packets: ParsedPacket[] = [];

  try {
    const decoder = new (PcapDecoder as any)(data);
    const decodedPackets = decoder.decode();

    for (const packet of decodedPackets) {
      const packetId = uuidv4();
      const tokens: Token[] = [];
      const sections: ParsedSection[] = [];
      let index = 0;

      // `packet.data` is a Uint8Array, which is a view on an ArrayBuffer.
      // We need the underlying ArrayBuffer for string extraction.
      const rawPacketDataBuffer = packet.data.buffer as ArrayBuffer;

      // Convert packet data to hex string for tokens and sections
      const packetDataHexString = Array.from(
        new Uint8Array(rawPacketDataBuffer),
      )
        .map((b: any) => b.toString(16).padStart(2, '0'))
        .join('');

      // Add packet data tokens (in 2-byte chunks)
      for (let i = 0; i < packetDataHexString.length; i += 2) {
        tokens.push({
          id: uuidv4(),
          value: packetDataHexString.substr(i, 2),
          type: 'token',
          index: index++,
        });
      }

      // Add packet data section
      sections.push({
        id: uuidv4(),
        type: 'body',
        startIndex: 0,
        endIndex: tokens.length,
        content: packetDataHexString,
      });

      const parsedPacket: ParsedPacket = {
        id: packetId,
        timestamp: new Date(
          packet.header.timestampSeconds * 1000 +
            packet.header.timestampMicroseconds / 1000,
        ).getTime(),
        sourceIP: '127.0.0.1', // Placeholder for now, needs proper IP header decoding for actual IPs
        destIP: '127.0.0.1', // Placeholder for now, needs proper IP header decoding for actual IPs
        sourcePort: packet.transport.sourcePort,
        destPort: packet.transport.destPort,
        protocol: packet.network.protocol, // From pcap-decoder's network layer
        length: packet.header.captureLength,
        rawData: rawPacketDataBuffer, // Assign raw ArrayBuffer
        // Initialize new fields
        detectedProtocols: [], // Will be populated by detectProtocols
        portBasedProtocol: undefined,
        deepInspectionProtocol: undefined,

        tokens,
        sections,
        fileReferences: [],
        extractedStrings: [], // Initialize extractedStrings
      };

      // --- Integrate protocol detection here ---
      parsedPacket.detectedProtocols = detectProtocols(
        parsedPacket,
        new Uint8Array(rawPacketDataBuffer),
      );
      // -----------------------------------------

      // --- Integrate string extraction here ---
      try {
        // Pass the ArrayBuffer to the worker
        const extracted = await extractStrings(
          rawPacketDataBuffer,
          packetId,
          0,
        ); // Assuming payloadOffset is 0 for the whole packet data
        parsedPacket.extractedStrings = extracted;
      } catch (strExtractError) {
        console.error(
          `Error extracting strings for packet ${packetId}:`,
          strExtractError,
        );
      }
      // ----------------------------------------

      // --- Integrate file extraction here ---
      const detectedFiles = fileExtractor.detectFileReferences(
        parsedPacket,
        new Uint8Array(rawPacketDataBuffer),
      );
      if (detectedFiles.length > 0) {
        parsedPacket.fileReferences = detectedFiles;
        // File references will be persisted when the packet is stored in the database.
      }
      // ------------------------------------

      // Add forensic analysis
      parsedPacket.suspiciousIndicators =
        analyzeSuspiciousIndicators(parsedPacket);
      parsedPacket.threatIntelligence = checkThreatIntelligence(parsedPacket);
      parsedPacket.forensicMetadata = createForensicMetadata(parsedPacket);

      // Create timeline event
      const timelineEvent = createTimelineEvent(parsedPacket);
      database.storeTimelineEvent(timelineEvent);

      packets.push(parsedPacket);
    }
  } catch (error) {
    console.warn('Error using pcap-decoder:', error);
    if (packets.length === 0) {
      console.error('Failed to decode any packets');
    }
  }

  return packets;
};

const parseStringData = (data: string): ParsedPacket => {
  try {
    // Generate a unique ID for this packet
    const packetId = uuidv4();

    // Parse tokens (non-alphanumeric characters excluding spaces and some symbols)
    const tokenRegex = /[^\w\s]/g;
    const tokens: Token[] = [];
    const sections: ParsedSection[] = [];
    const fileReferences: FileReference[] = []; // Will be populated from URLs found in string data
    let index = 0;

    let match;
    let lastIndex = 0;

    // Extract tokens and strings
    while ((match = tokenRegex.exec(data)) !== null) {
      // Add the string before the token if it exists
      if (match.index > lastIndex) {
        const stringContent = data.substring(lastIndex, match.index).trim();
        if (stringContent) {
          tokens.push({
            id: uuidv4(),
            value: stringContent,
            type: 'string',
            index: index++,
          });
        }
      }

      // Add the token
      tokens.push({
        id: uuidv4(),
        value: match[0],
        type: 'token',
        index: index++,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining string after the last token
    if (lastIndex < data.length) {
      const stringContent = data.substring(lastIndex).trim();
      if (stringContent) {
        tokens.push({
          id: uuidv4(),
          value: stringContent,
          type: 'string',
          index: index++,
        });
      }
    }

    // Identify sections like headers, body, etc.
    const headerEndIndex = Math.floor(tokens.length * 0.2);
    sections.push({
      id: uuidv4(),
      type: 'header',
      startIndex: 0,
      endIndex: headerEndIndex,
      content: tokens
        .slice(0, headerEndIndex)
        .map((t) => t.value)
        .join(''),
    });

    const bodyEndIndex = Math.floor(tokens.length * 0.8);
    sections.push({
      id: uuidv4(),
      type: 'body',
      startIndex: headerEndIndex,
      endIndex: bodyEndIndex,
      content: tokens
        .slice(headerEndIndex, bodyEndIndex)
        .map((t) => t.value)
        .join(''),
    });

    sections.push({
      id: uuidv4(),
      type: 'footer',
      startIndex: bodyEndIndex,
      endIndex: tokens.length,
      content: tokens
        .slice(bodyEndIndex)
        .map((t) => t.value)
        .join(''),
    });

    // Detect file references from URLs in the string data
    const urlRegex = /(?:https?|ftp):\/\/[^\s\/$.?#].[^\s]*/gi;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(data)) !== null) {
      const url = urlMatch[0];
      // Extract filename from URL
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      // Check if the last part looks like a filename (has an extension)
      if (lastPart && /\.[a-z0-9]+$/i.test(lastPart)) {
        const filename = lastPart.split('?')[0]; // Remove query parameters
        fileReferences.push({
          id: uuidv4(),
          filename: filename,
          size: 0,
          mimeType: 'application/octet-stream',
          sourcePacketId: packetId,
          data: new Blob([], { type: 'application/octet-stream' }),
          sha256Hash: '',
        });
      }
    }

    const parsedPacket: ParsedPacket = {
      id: packetId,
      timestamp: Date.now(),
      sourceIP: generateRandomIP(),
      destIP: generateRandomIP(),
      sourcePort: 0,
      destPort: 0,
      protocol: determineStringProtocol(data),
      length: data.length,
      tokens,
      sections,
      fileReferences,
      rawData: new TextEncoder().encode(data).buffer, // Convert string to ArrayBuffer
      extractedStrings: [],
      detectedProtocols: [],
    };
    // Run protocol detection for string data
    parsedPacket.detectedProtocols = detectProtocols(
      parsedPacket,
      new Uint8Array(parsedPacket.rawData),
    );
    // Optionally set portBasedProtocol/deepInspectionProtocol if needed
    // (detectProtocols already populates detectedProtocols)

    parsedPacket.suspiciousIndicators =
      analyzeSuspiciousIndicators(parsedPacket);
    parsedPacket.threatIntelligence = checkThreatIntelligence(parsedPacket);
    parsedPacket.forensicMetadata = createForensicMetadata(parsedPacket);

    const timelineEvent = createTimelineEvent(parsedPacket);
    database.storeTimelineEvent(timelineEvent);

    return parsedPacket;
  } catch (error) {
    console.error('Error parsing string data:', error);
    throw error;
  }
};

// No longer needed as protocol detection is handled by protocolDetector.ts
// const determineProtocol = (_data: Uint8Array | ArrayBuffer): string => {
//     // Implementation would analyze packet headers and data
//     return 'TCP'; // Default to TCP for now instead of random
// };

function determineStringProtocol(data: string): string {
  if (
    data.startsWith('GET') ||
    data.startsWith('POST') ||
    data.startsWith('HTTP')
  ) {
    return 'HTTP';
  }
  return 'TCP';
}

/**
 * Generates a random IP address for demo purposes
 */
function generateRandomIP(): string {
  return Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256))
    .join('.');
}

/**
 * Simulates downloading a file from a URI
 */
export function downloadFile(fileRef: FileReference): Promise<FileReference> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedFile = {
        ...fileRef,
        downloadStatus: 'downloaded' as const,
        fileSize: Math.floor(Math.random() * 1000000),
        fileType: getFileTypeFromName(fileRef.filename),
        lastModified: new Date().toISOString(),
      };

      resolve(updatedFile);
    }, 1500);
  });
}

/**
 * Gets file type based on filename extension
 */
function getFileTypeFromName(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const fileTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    html: 'text/html',
    htm: 'text/html',
    xml: 'application/xml',
    json: 'application/json',
    zip: 'application/zip',
  };

  return fileTypes[extension] || 'application/octet-stream';
}
