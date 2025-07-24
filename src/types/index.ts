export interface Token {
  id: string;
  value: string;
  type: 'token' | 'string';
  index: number;
}

export interface ParsedSection {
  id: string;
  type: 'header' | 'body' | 'footer' | 'from' | 'to' | 'subject' | 'sheet' | 'cell';
  startIndex: number;
  endIndex: number;
  content: string;
}

export interface FileReference {
  id: string;
  uri: string;
  fileName: string;
  hash: string;
  downloadStatus: 'pending' | 'downloaded' | 'failed';
  fileSize?: number;
  fileType?: string;
  lastModified?: string;
}

export interface ParsedPacket {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  tokens: Token[];
  sections: ParsedSection[];
  fileReferences: FileReference[];
  rawData: string;
  forensicMetadata?: ForensicMetadata;
  threatIntelligence?: ThreatIntelligence[];
  suspiciousIndicators?: SuspiciousIndicator[];
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
  type: 'malicious_domain' | 'malicious_ip' | 'malware_signature' | 'suspicious_pattern';
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  lastUpdated: string;
}

export interface SuspiciousIndicator {
  id: string;
  type: 'unusual_port' | 'encrypted_payload' | 'base64_content' | 'suspicious_user_agent' | 
        'data_exfiltration' | 'command_injection' | 'sql_injection' | 'xss_attempt' | 'brute_force';
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
  type: 'network_activity' | 'file_access' | 'authentication' | 'data_transfer' | 'suspicious_activity';
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
    attribution?: any[];
    
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
    sources?: any[];
    
    // Additional custom fields
    [key: string]: any;
  };
}

export interface User {
  id: string;
  username: string;
  role: 'lead_investigator' | 'investigator' | 'analyst' | 'viewer';
}