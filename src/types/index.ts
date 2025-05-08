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

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'viewer';
}