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

import { parsePcap } from '../utils/pcapUtils';
import { generateFlowId } from '../utils/flowUtils'; // Import generateFlowId

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
 * Browser-compatible PCAP parser implementation using custom parser
 */
const parsePcapData = async (data: ArrayBuffer): Promise<ParsedPacket[]> => {
  const allPackets: ParsedPacket[] = [];
  const BATCH_SIZE = 50;

  try {
    const { packets: pcapPackets } = parsePcap(data);
    console.log(`Parsed ${pcapPackets.length} raw packets from PCAP.`);

    // Helper function to process a single packet
    const processPacket = async (
      packet: import('../utils/pcapUtils').PcapPacket,
    ): Promise<{
      parsedPacket: ParsedPacket;
      timelineEvent: import('../types').TimelineEvent;
    }> => {
      const packetId = uuidv4();
      const tokens: Token[] = [];
      const sections: ParsedSection[] = [];
      let index = 0;

      // packet.data is the raw packet data (Ethernet frame)
      const rawPacketData = packet.data;
      const rawPacketDataBuffer = rawPacketData.buffer.slice(
        rawPacketData.byteOffset,
        rawPacketData.byteOffset + rawPacketData.byteLength,
      );

      // Parse Ethernet header (14 bytes)
      // Skip for now, start at IP layer (offset 14)
      const ipStart = 14;

      // Parse IP header
      let sourceIP = '0.0.0.0';
      let destIP = '0.0.0.0';
      let protocol = 'unknown';
      let sourcePort = 0;
      let destPort = 0;
      let packetFlags: string[] | undefined = undefined;
      let packetSeq: number | undefined = undefined;
      let packetAck: number | undefined = undefined;

      if (rawPacketData.length >= ipStart + 20) {
        // Extract source and dest IP (bytes 12-19 of IP header)
        sourceIP = `${rawPacketData[ipStart + 12]}.${rawPacketData[ipStart + 13]}.${rawPacketData[ipStart + 14]}.${rawPacketData[ipStart + 15]}`;
        destIP = `${rawPacketData[ipStart + 16]}.${rawPacketData[ipStart + 17]}.${rawPacketData[ipStart + 18]}.${rawPacketData[ipStart + 19]}`;

        // Get protocol number (byte 9 of IP header)
        const protocolNum = rawPacketData[ipStart + 9];

        // Calculate IP header length (first nibble of first byte * 4)
        const ipHeaderLength = (rawPacketData[ipStart] & 0x0f) * 4;
        const transportStart = ipStart + ipHeaderLength;

        // Parse transport layer
        if (protocolNum === 6 && rawPacketData.length >= transportStart + 14) {
          // TCP
          protocol = 'TCP';
          sourcePort =
            (rawPacketData[transportStart] << 8) |
            rawPacketData[transportStart + 1];
          destPort =
            (rawPacketData[transportStart + 2] << 8) |
            rawPacketData[transportStart + 3];

          const flags: string[] = [];
          const flagsByte = rawPacketData[transportStart + 13]; // TCP flags byte

          if (flagsByte & 0x01) flags.push('FIN');
          if (flagsByte & 0x02) flags.push('SYN');
          if (flagsByte & 0x04) flags.push('RST');
          if (flagsByte & 0x08) flags.push('PSH');
          if (flagsByte & 0x10) flags.push('ACK');
          if (flagsByte & 0x20) flags.push('URG');
          if (flagsByte & 0x40) flags.push('ECE');
          if (flagsByte & 0x80) flags.push('CWR');
          if (flagsByte & 0x80) flags.push('CWR');
          packetFlags = flags;

          // Parse Sequence and Acknowledgment Numbers
          // Seq Number: Bytes 4-7 of TCP header
          // Ack Number: Bytes 8-11 of TCP header
          const seq =
            (rawPacketData[transportStart + 4] * 16777216 + // using arithmetic to avoid bitwise signed 32-bit issue
              (rawPacketData[transportStart + 5] << 16)) |
            (rawPacketData[transportStart + 6] << 8) |
            rawPacketData[transportStart + 7];

          const ack =
            (rawPacketData[transportStart + 8] * 16777216 +
              (rawPacketData[transportStart + 9] << 16)) |
            (rawPacketData[transportStart + 10] << 8) |
            rawPacketData[transportStart + 11];

          // We need to pass these out. Let's declare vars in outer scope like packetFlags
          packetSeq = seq >>> 0; // Unsigned shift to ensure positive integer
          packetAck = ack >>> 0;
        } else if (
          protocolNum === 17 &&
          rawPacketData.length >= transportStart + 4
        ) {
          // UDP
          protocol = 'UDP';
          sourcePort =
            (rawPacketData[transportStart] << 8) |
            rawPacketData[transportStart + 1];
          destPort =
            (rawPacketData[transportStart + 2] << 8) |
            rawPacketData[transportStart + 3];
        } else {
          protocol = `IP-${protocolNum}`;
        }
      }

      // Convert packet data to hex string for tokens and sections
      const packetDataHexString = Array.from(rawPacketData)
        .map((b: number) => b.toString(16).padStart(2, '0'))
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
        timestamp:
          packet.header.tsSec * 1000 + Math.floor(packet.header.tsUsec / 1000),
        sourceIP,
        destIP,
        sourcePort,
        destPort,
        protocol,
        length: packet.header.inclLen,
        rawData: rawPacketDataBuffer as ArrayBuffer, // Assign raw ArrayBuffer
        flags: packetFlags,
        seq: packetSeq,
        ack: packetAck,
        // Initialize new fields
        detectedProtocols: [], // Will be populated by detectProtocols
        portBasedProtocol: undefined,
        deepInspectionProtocol: undefined,

        tokens,
        sections,
        fileReferences: [],
        extractedStrings: [], // Initialize extractedStrings
      };

      // Generate Flow ID
      parsedPacket.flowId = generateFlowId(parsedPacket);

      // --- Integrate protocol detection here ---
      parsedPacket.detectedProtocols = detectProtocols(
        parsedPacket,
        new Uint8Array(rawPacketDataBuffer),
      );
      // -----------------------------------------

      // --- Integrate string extraction here ---
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('String extraction timed out')),
            2000,
          );
        });

        // Pass the ArrayBuffer to the worker
        // console.time('extractStrings');
        const extractionPromise = extractStrings(
          rawPacketDataBuffer.slice(0) as ArrayBuffer, // Pass a copy to avoid detachment
          packetId,
          0,
        ); // Assuming payloadOffset is 0 for the whole packet data

        const extracted = await Promise.race([
          extractionPromise,
          timeoutPromise,
        ]);
        // console.timeEnd('extractStrings');

        parsedPacket.extractedStrings =
          extracted as import('../types/extractedStrings').ExtractedString[];
      } catch (strExtractError) {
        // console.warn(
        //   `Error extracting strings for packet ${packetId}:`,
        //   strExtractError,
        // );
        // Fallback or empty strings on error/timeout
        parsedPacket.extractedStrings = [];
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
      // database.storeTimelineEvent(timelineEvent); // Don't store individually

      return { parsedPacket, timelineEvent };
    };

    // Process in Batches
    for (let i = 0; i < pcapPackets.length; i += BATCH_SIZE) {
      const batch = pcapPackets.slice(i, i + BATCH_SIZE);
      if (i % 500 === 0) {
        // console.log(`Processing batch starting at ${i}/${pcapPackets.length}`);
        // Yield to main thread briefly to update UI/logs
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const batchResults = await Promise.all(batch.map(processPacket));

      // Extract packets and timeline events
      const batchPackets = batchResults.map((r) => r.parsedPacket);
      const batchTimelineEvents = batchResults.map((r) => r.timelineEvent);

      // Bulk store timeline events
      await database.storeTimelineEvents(batchTimelineEvents);

      allPackets.push(...batchPackets);
    }
  } catch (error) {
    console.warn('Error parsing PCAP data:', error);
    if (allPackets.length === 0) {
      console.error('Failed to decode any packets');
    }
  }

  return allPackets;
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
    const urlRegex = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi;
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
