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
  role: 'admin' | 'user' | 'viewer';
}