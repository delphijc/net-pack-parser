// client/src/types/packet.ts

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
}
