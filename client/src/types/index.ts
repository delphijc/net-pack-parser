export interface Token {
  id: string;
  value: string;
  type: 'token' | 'string';
  index: number;
}

export interface ParsedSection {
  id: string;
  type:
  | 'header'
  | 'body'
  | 'footer'
  | 'from'
  | 'to'
  | 'subject'
  | 'sheet'
  | 'cell';
  startIndex: number;
  endIndex: number;
  content: string;
}

import type { Packet } from './packet';
export type { Packet };
import type { FileReference } from './fileReference';
export * from './fileReference';
import type { ExtractedString } from './extractedStrings';
import type { ThreatAlert } from './threat';

export interface ParsedPacket extends Packet {
  tokens: Token[];
  sections: ParsedSection[];
  fileReferences: FileReference[];
  forensicMetadata?: ForensicMetadata;
  threatIntelligence?: ThreatIntelligence[];
  suspiciousIndicators?: SuspiciousIndicator[];
  matchesSearch?: boolean;
  sessionId?: string; // Optional for backward compatibility/legacy packets
  dnsQuery?: string;
  httpHost?: string;
  fileHash?: string;
  info?: string; // Summary info
  extractedStrings?: ExtractedString[];
  threats?: ThreatAlert[];
}

export interface ForensicMetadata {
  caseNumber?: string;
  evidenceId?: string;
  acquisitionTimestamp: string;
  md5Hash: string;
  sha256Hash: string;
  sourceDevice?: string;
  investigator?: string;
  chainOfCustody: ChainOfCustodyEntry[];
}

export interface ChainOfCustodyEntry {
  id: string;
  timestamp: string;
  action: 'acquired' | 'analyzed' | 'transferred' | 'modified' | 'exported';
  investigator: string;
  notes?: string;
  location?: string;
}

export interface ThreatIntelligence {
  id: string;
  type:
  | 'malicious_domain'
  | 'malicious_ip'
  | 'malware_signature'
  | 'suspicious_pattern';
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  lastUpdated: string;
}

export interface SuspiciousIndicator {
  id: string;
  type:
  | 'unusual_port'
  | 'encrypted_payload'
  | 'base64_content'
  | 'suspicious_user_agent'
  | 'data_exfiltration'
  | 'command_injection'
  | 'sql_injection'
  | 'xss_attempt'
  | 'brute_force'
  | 'live_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  confidence: number; // 0-100
  mitreTactic?: string;
  mitreTechnique?: string;
}

export interface ForensicCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  investigator: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'closed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  packetIds: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type:
  | 'network_activity'
  | 'file_access'
  | 'authentication'
  | 'data_transfer'
  | 'suspicious_activity';
  source: string;
  destination?: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  packetId?: string;
  evidence: string[];
}

export interface PerformanceEntryData {
  id: string;
  entryType: string;
  name: string;
  startTime: number;
  duration: number;
  timestamp: string;
  details: {
    // Navigation timing details
    domainLookupStart?: number;
    domainLookupEnd?: number;
    connectStart?: number;
    connectEnd?: number;
    requestStart?: number;
    responseStart?: number;
    responseEnd?: number;
    domInteractive?: number;
    domContentLoadedEventStart?: number;
    domContentLoadedEventEnd?: number;
    domComplete?: number;
    loadEventStart?: number;
    loadEventEnd?: number;

    // Resource timing details
    initiatorType?: string;
    transferSize?: number;
    encodedBodySize?: number;
    decodedBodySize?: number;

    // Long task details
    attribution?: unknown[];

    // Largest Contentful Paint details
    renderTime?: number;
    loadTime?: number;
    size?: number;
    element?: string;
    url?: string;

    // Paint timing details

    // First Input Delay details
    processingStart?: number;
    processingEnd?: number;

    // Layout shift details
    value?: number;
    hadRecentInput?: boolean;
    sources?: unknown[];

    // Additional custom fields
    [key: string]: unknown;
  };
}

export interface User {
  id: string;
  username: string;
  role: 'lead_investigator' | 'investigator' | 'analyst' | 'viewer';
}

export interface ChainOfCustodyEvent {
  id: string;
  timestamp: string;
  action: string; // e.g., "File Uploaded", "Filter Applied"
  details: string; // Generic description
  user?: string; // "Analyst" or specific user
  hash?: string; // SHA-256 hash if applicable to data
  metadata?: {
    filename?: string;
    fileSize?: number;
    md5Hash?: string;
    userAgent?: string;
    [key: string]: any;
  };
}
