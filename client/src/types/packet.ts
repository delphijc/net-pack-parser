// client/src/types/packet.ts

import type { ExtractedString } from './extractedStrings';
import type { FileReference } from './fileReference'; // Added

export interface Packet {
  id: string;                    // UUID
  timestamp: number;             // Unix timestamp (ms)
  sourceIP: string;              // IPv4 or IPv6
  destIP: string;
  sourcePort: number;
  destPort: number;
  protocol: string;              // 'TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS'
  length: number;                // Bytes
  rawData: ArrayBuffer;          // Packet payload
  flags?: string[];              // TCP flags ['SYN', 'ACK']
  sessionId?: string;            // For TCP session grouping
  extractedStrings?: ExtractedString[]; // Array of extracted strings from the payload
  fileReferences?: FileReference[]; // Added
  detectedProtocols: string[];   // List of detected protocols (e.g., ["TCP", "HTTP"])
  portBasedProtocol?: string;    // Protocol detected via port heuristics
  deepInspectionProtocol?: string; // Protocol detected via deep packet inspection
}
