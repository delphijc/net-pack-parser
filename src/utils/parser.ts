import { Token, ParsedSection, FileReference, ParsedPacket } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SHA256 } from 'crypto-js';

/**
 * Validates a URL string
 */
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Starts network traffic capture
 */
export const startNetworkCapture = async (): Promise<void> => {
  // For browser environments, we'll use the Performance API to capture network requests
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource') {
        // Parse the network request data
        const data = JSON.stringify(entry);
        parseNetworkData(data);
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });
};

/**
 * Stops network traffic capture
 */
export const stopNetworkCapture = (): void => {
  // Stop all performance observers
  PerformanceObserver.disconnect();
};

/**
 * Parses network traffic data into tokens and strings
 */
export const parseNetworkData = (data: string | ArrayBuffer): ParsedPacket => {
  // Check if the data is a PCAP file (starts with magic number)
  if (data instanceof ArrayBuffer) {
    return parsePcapData(data);
  }
  
  // Generate a unique ID for this packet
  const packetId = uuidv4();
  
  // Parse tokens (non-alphanumeric characters excluding spaces and some symbols)
  const tokenRegex = /[^\w\s]/g;
  const tokens: Token[] = [];
  const sections: ParsedSection[] = [];
  const fileReferences: FileReference[] = [];
  
  let match;
  let index = 0;
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
          index: index++
        });
      }
    }
    
    // Add the token
    tokens.push({
      id: uuidv4(),
      value: match[0],
      type: 'token',
      index: index++
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
        index: index++
      });
    }
  }
  
  // Identify sections like headers, body, etc.
  // For demo purposes, we'll detect some common patterns
  
  // Find header section (first 20% of the data)
  const headerEndIndex = Math.floor(tokens.length * 0.2);
  sections.push({
    id: uuidv4(),
    type: 'header',
    startIndex: 0,
    endIndex: headerEndIndex,
    content: tokens.slice(0, headerEndIndex).map(t => t.value).join('')
  });
  
  // Find body section (middle 60% of the data)
  const bodyEndIndex = Math.floor(tokens.length * 0.8);
  sections.push({
    id: uuidv4(),
    type: 'body',
    startIndex: headerEndIndex,
    endIndex: bodyEndIndex,
    content: tokens.slice(headerEndIndex, bodyEndIndex).map(t => t.value).join('')
  });
  
  // Find footer section (last 20% of the data)
  sections.push({
    id: uuidv4(),
    type: 'footer',
    startIndex: bodyEndIndex,
    endIndex: tokens.length,
    content: tokens.slice(bodyEndIndex).map(t => t.value).join('')
  });
  
  // Extract URIs for file references
  const uriRegex = /(https?:\/\/[^\s]+)/g;
  let uriMatch;
  
  while ((uriMatch = uriRegex.exec(data)) !== null) {
    const uri = uriMatch[0].replace(/[.,;!?]$/, ''); // Remove trailing punctuation
    
    // Validate the URL before adding it
    if (isValidUrl(uri)) {
      // Extract filename from URI
      const url = new URL(uri);
      const fileName = url.pathname.split('/').pop() || 'unknown';
      
      fileReferences.push({
        id: uuidv4(),
        uri,
        fileName,
        hash: SHA256(uri).toString(),
        downloadStatus: 'pending'
      });
    }
  }
  
  // Construct the complete parsed packet
  return {
    id: packetId,
    timestamp: new Date().toISOString(),
    source: generateRandomIP(),
    destination: generateRandomIP(),
    protocol: ['HTTP', 'HTTPS', 'FTP', 'SMTP', 'TCP'][Math.floor(Math.random() * 5)],
    tokens,
    sections,
    fileReferences,
    rawData: data
  };
};

/**
 * Browser-compatible PCAP parser implementation
 */
const parsePcapData = (data: ArrayBuffer): ParsedPacket => {
  const packetId = uuidv4();
  const tokens: Token[] = [];
  const sections: ParsedSection[] = [];
  let index = 0;

  // Read PCAP header (24 bytes)
  const headerView = new DataView(data, 0, 24);
  
  // Magic number (4 bytes) - determines endianness
  const magicNumber = headerView.getUint32(0, true);
  const isLittleEndian = magicNumber === 0xa1b2c3d4;
  
  // Version numbers
  const versionMajor = headerView.getUint16(4, isLittleEndian);
  const versionMinor = headerView.getUint16(6, isLittleEndian);
  
  tokens.push({
    id: uuidv4(),
    value: `Version: ${versionMajor}.${versionMinor}`,
    type: 'string',
    index: index++
  });

  // Add PCAP header section
  sections.push({
    id: uuidv4(),
    type: 'header',
    startIndex: 0,
    endIndex: 1,
    content: `PCAP Version ${versionMajor}.${versionMinor}`
  });

  // Convert packet data to hex string for display
  const packetData = Array.from(new Uint8Array(data.slice(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Add packet data tokens (in 2-byte chunks)
  for (let i = 0; i < packetData.length; i += 2) {
    tokens.push({
      id: uuidv4(),
      value: packetData.substr(i, 2),
      type: 'token',
      index: index++
    });
  }

  // Add packet data section
  sections.push({
    id: uuidv4(),
    type: 'body',
    startIndex: 1,
    endIndex: tokens.length,
    content: packetData
  });

  return {
    id: packetId,
    timestamp: new Date().toISOString(),
    source: extractSourceIP(data),
    destination: extractDestinationIP(data),
    protocol: determineProtocol(data),
    tokens,
    sections,
    fileReferences: [],
    rawData: Array.from(new Uint8Array(data)).map(b => b.toString(16)).join('')
  };
};

/**
 * Extracts source IP from PCAP data
 */
const extractSourceIP = (data: ArrayBuffer): string => {
  // Implementation would parse IP header from packet data
  return generateRandomIP(); // Placeholder for demo
};

/**
 * Extracts destination IP from PCAP data
 */
const extractDestinationIP = (data: ArrayBuffer): string => {
  // Implementation would parse IP header from packet data
  return generateRandomIP(); // Placeholder for demo
};

/**
 * Determines protocol from PCAP data
 */
const determineProtocol = (data: ArrayBuffer): string => {
  // Implementation would analyze packet headers and data
  return ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS'][Math.floor(Math.random() * 5)];
};

/**
 * Generates a random IP address for demo purposes
 */
const generateRandomIP = (): string => {
  return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
};

/**
 * Simulates downloading a file from a URI
 */
export const downloadFile = async (fileRef: FileReference): Promise<FileReference> => {
  // In a real implementation, this would actually download the file
  // For demo purposes, we'll simulate a delay and update the status
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedFile = {
        ...fileRef,
        downloadStatus: 'downloaded' as const,
        fileSize: Math.floor(Math.random() * 1000000), // Random file size in bytes
        fileType: getFileTypeFromName(fileRef.fileName),
        lastModified: new Date().toISOString()
      };
      
      resolve(updatedFile);
    }, 1500); // Simulate network delay
  });
};

/**
 * Gets file type based on filename extension
 */
const getFileTypeFromName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const fileTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'xml': 'application/xml',
    'json': 'application/json',
    'zip': 'application/zip'
  };
  
  return fileTypes[extension] || 'application/octet-stream';
};