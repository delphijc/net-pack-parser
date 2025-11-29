// client/src/utils/multiCriteriaSearch.ts

import type { Packet } from '@/types'; // Assuming '@/types' exports a Packet interface

// =============================================================================
//  Interfaces for Search Criteria
// =============================================================================

export interface IpCriterion {
  ip: string;
  isCidr: boolean;
}

export interface PortCriterion {
  port: number | { start: number; end: number };
}

export interface ProtocolCriterion {
  protocol: string; // e.g., "TCP", "UDP", "HTTP"
}

export interface TimeRangeCriterion {
  start: number; // Unix timestamp in milliseconds
  end: number;   // Unix timestamp in milliseconds
}

export interface PayloadCriterion {
  content: string;
  caseSensitive: boolean;
}

export type LogicalOperator = 'AND' | 'OR';

export interface MultiSearchCriteria {
  sourceIp?: IpCriterion;
  destIp?: IpCriterion;
  sourcePort?: PortCriterion;
  destPort?: PortCriterion;
  protocol?: ProtocolCriterion;
  timeRange?: TimeRangeCriterion;
  payload?: PayloadCriterion;
  logic: LogicalOperator;
}

// =============================================================================
//  Individual Matching Functions
// =============================================================================

/**
 * Matches an IP address against a criterion.
 * Supports exact match and CIDR notation.
 */
function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function matchIp(packetIp: string, criterion: IpCriterion): boolean {
  if (!criterion || !criterion.ip) return true;

  if (criterion.isCidr) {
    try {
      const [range, bitsStr] = criterion.ip.split('/');
      const bits = bitsStr ? parseInt(bitsStr, 10) : 32;

      // Simple IPv4 check
      if (packetIp.includes('.') && range.includes('.')) {
        const mask = ~(2 ** (32 - bits) - 1);
        return (ipToLong(packetIp) & mask) === (ipToLong(range) & mask);
      }
      // Fallback for IPv6 or other formats (simplified prefix match)
      return packetIp.startsWith(range);
    } catch (e) {
      console.error('Invalid CIDR or IP format', e);
      return false;
    }
  } else {
    return packetIp === criterion.ip;
  }
}

/**
 * Matches a port number against a criterion.
 * Supports exact match and range (e.g., 80-443).
 */
export function matchPort(packetPort: number, criterion: PortCriterion): boolean {
  // If no criterion or criterion.port is undefined/null, it matches everything
  if (!criterion || criterion.port === undefined || criterion.port === null) return true;

  if (typeof criterion.port === 'number') {
    return packetPort === criterion.port;
  } else if (criterion.port.start !== undefined && criterion.port.end !== undefined) {
    return packetPort >= criterion.port.start && packetPort <= criterion.port.end;
  }
  // If criterion.port is an object but doesn't have both start and end, it's an invalid range
  return false;
}

/**
 * Matches a protocol type against a criterion.
 */
export function matchProtocol(protocols: string[], criterion: ProtocolCriterion): boolean {
  if (!criterion || !criterion.protocol) return true;
  const searchProto = criterion.protocol.toLowerCase();
  return protocols.some(p => p.toLowerCase() === searchProto);
}

/**
 * Matches a packet timestamp against a time range criterion.
 */
export function matchTime(packetTimestamp: number, criterion: TimeRangeCriterion): boolean {
  if (!criterion || (!criterion.start && !criterion.end)) return true;
  if (criterion.start && packetTimestamp < criterion.start) return false;
  if (criterion.end && packetTimestamp > criterion.end) return false;
  return true;
}

/**
 * Matches packet payload content against a search string.
 * Supports case-sensitive and case-insensitive search.
 */
export function matchPayload(packetPayload: ArrayBuffer, criterion: PayloadCriterion): boolean {
  if (!criterion || !criterion.content) return true;

  const payloadString = new TextDecoder().decode(packetPayload);
  const searchContent = criterion.content;

  if (criterion.caseSensitive) {
    return payloadString.includes(searchContent);
  } else {
    return payloadString.toLowerCase().includes(searchContent.toLowerCase());
  }
}

// =============================================================================
//  Main Multi-Criteria Search Function
// =============================================================================

export interface MatchDetails {
  sourceIp: boolean;
  destIp: boolean;
  sourcePort: boolean;
  destPort: boolean;
  protocol: boolean;
  payloadMatches: { offset: number; length: number }[];
}

/**
 * Returns detailed match information for highlighting.
 */
export function getMatchDetails(packet: Packet, criteria: MultiSearchCriteria): MatchDetails {
  const details: MatchDetails = {
    sourceIp: false,
    destIp: false,
    sourcePort: false,
    destPort: false,
    protocol: false,
    payloadMatches: []
  };

  if (!criteria) return details;

  if (criteria.sourceIp) {
    details.sourceIp = matchIp(packet.sourceIP, criteria.sourceIp);
  }
  if (criteria.destIp) {
    details.destIp = matchIp(packet.destIP, criteria.destIp);
  }
  if (criteria.sourcePort) {
    details.sourcePort = matchPort(packet.sourcePort, criteria.sourcePort);
  }
  if (criteria.destPort) {
    details.destPort = matchPort(packet.destPort, criteria.destPort);
  }
  if (criteria.protocol) {
    const protocols = [packet.protocol, ...(packet.detectedProtocols || [])];
    details.protocol = matchProtocol(protocols, criteria.protocol);
  }
  if (criteria.payload && packet.rawData) {
    // We need to find all occurrences for highlighting
    const payloadString = new TextDecoder().decode(packet.rawData);
    const searchContent = criteria.payload.content;
    if (searchContent) {
      const haystack = criteria.payload.caseSensitive ? payloadString : payloadString.toLowerCase();
      const needle = criteria.payload.caseSensitive ? searchContent : searchContent.toLowerCase();

      let startIndex = 0;
      let index;
      while ((index = haystack.indexOf(needle, startIndex)) > -1) {
        details.payloadMatches.push({ offset: index, length: needle.length });
        startIndex = index + needle.length;
      }
    }
  }

  return details;
}

export function multiCriteriaSearch(packet: Packet, criteria: MultiSearchCriteria): boolean {
  const matches: boolean[] = [];

  // Evaluate each criterion
  if (criteria.sourceIp) {
    matches.push(matchIp(packet.sourceIP, criteria.sourceIp));
  }
  if (criteria.destIp) {
    matches.push(matchIp(packet.destIP, criteria.destIp));
  }
  if (criteria.sourcePort) {
    matches.push(matchPort(packet.sourcePort, criteria.sourcePort));
  }
  if (criteria.destPort) {
    matches.push(matchPort(packet.destPort, criteria.destPort));
  }
  if (criteria.protocol) {
    // Check both primary protocol and detected protocols
    const protocols = [packet.protocol, ...(packet.detectedProtocols || [])];
    matches.push(matchProtocol(protocols, criteria.protocol));
  }
  if (criteria.timeRange) {
    matches.push(matchTime(packet.timestamp, criteria.timeRange));
  }
  if (criteria.payload && packet.rawData) { // Ensure rawData exists for payload search
    matches.push(matchPayload(packet.rawData, criteria.payload));
  }

  // Handle logical combination
  if (matches.length === 0) {
    return true; // No criteria, so it matches
  }

  if (criteria.logic === 'AND') {
    return matches.every(m => m === true);
  } else { // OR logic
    return matches.some(m => m === true);
  }
}

export function filterPackets(packets: Packet[], criteria: MultiSearchCriteria): Packet[] {
  if (!criteria || Object.keys(criteria).length === 0) {
    return packets; // No criteria, return all packets
  }
  return packets.filter(packet => multiCriteriaSearch(packet, criteria));
}
