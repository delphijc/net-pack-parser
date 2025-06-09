import { Token, ParsedSection, FileReference, ParsedPacket, PerformanceEntryData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SHA256 } from 'crypto-js';
import database from '../services/database';

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

// Store the observer reference so we can disconnect it later
let networkObserver: PerformanceObserver | null = null;
let capturedPackets: ParsedPacket[] = [];

/**
 * Creates performance entry data from PerformanceEntry
 */
const createPerformanceEntryData = (entry: PerformanceEntry): PerformanceEntryData => {
  const performanceEntry: PerformanceEntryData = {
    id: uuidv4(),
    entryType: entry.entryType,
    name: entry.name,
    startTime: entry.startTime,
    duration: entry.duration,
    timestamp: new Date().toISOString(),
    details: {}
  };

  // Handle different entry types with specific details
  switch (entry.entryType) {
    case 'navigation':
      const navEntry = entry as PerformanceNavigationTiming;
      performanceEntry.details = {
        domainLookupStart: navEntry.domainLookupStart,
        domainLookupEnd: navEntry.domainLookupEnd,
        connectStart: navEntry.connectStart,
        connectEnd: navEntry.connectEnd,
        requestStart: navEntry.requestStart,
        responseStart: navEntry.responseStart,
        responseEnd: navEntry.responseEnd,
        domInteractive: navEntry.domInteractive,
        domContentLoadedEventStart: navEntry.domContentLoadedEventStart,
        domContentLoadedEventEnd: navEntry.domContentLoadedEventEnd,
        domComplete: navEntry.domComplete,
        loadEventStart: navEntry.loadEventStart,
        loadEventEnd: navEntry.loadEventEnd,
        transferSize: navEntry.transferSize,
        encodedBodySize: navEntry.encodedBodySize,
        decodedBodySize: navEntry.decodedBodySize
      };
      break;

    case 'resource':
      const resourceEntry = entry as PerformanceResourceTiming;
      performanceEntry.details = {
        initiatorType: resourceEntry.initiatorType,
        transferSize: resourceEntry.transferSize,
        encodedBodySize: resourceEntry.encodedBodySize,
        decodedBodySize: resourceEntry.decodedBodySize,
        domainLookupStart: resourceEntry.domainLookupStart,
        domainLookupEnd: resourceEntry.domainLookupEnd,
        connectStart: resourceEntry.connectStart,
        connectEnd: resourceEntry.connectEnd,
        requestStart: resourceEntry.requestStart,
        responseStart: resourceEntry.responseStart,
        responseEnd: resourceEntry.responseEnd
      };
      break;

    case 'longtask':
      const longTaskEntry = entry as any; // PerformanceLongTaskTiming not widely supported in TS
      performanceEntry.details = {
        attribution: longTaskEntry.attribution || []
      };
      break;

    case 'largest-contentful-paint':
      const lcpEntry = entry as any; // PerformanceLargestContentfulPaint
      performanceEntry.details = {
        renderTime: lcpEntry.renderTime,
        loadTime: lcpEntry.loadTime,
        size: lcpEntry.size,
        element: lcpEntry.element?.tagName || 'unknown',
        url: lcpEntry.url || ''
      };
      break;

    case 'paint':
      // Paint entries (first-paint, first-contentful-paint)
      performanceEntry.details = {
        paintType: entry.name
      };
      break;

    case 'first-input':
      const fiEntry = entry as any; // PerformanceFirstInputTiming
      performanceEntry.details = {
        processingStart: fiEntry.processingStart,
        processingEnd: fiEntry.processingEnd
      };
      break;

    case 'layout-shift':
      const lsEntry = entry as any; // PerformanceLayoutShiftTiming
      performanceEntry.details = {
        value: lsEntry.value,
        hadRecentInput: lsEntry.hadRecentInput,
        sources: lsEntry.sources || []
      };
      break;

    default:
      // Store any additional properties
      performanceEntry.details = { ...entry };
      break;
  }

  return performanceEntry;
};

/**
 * Starts network traffic capture with enhanced performance monitoring
 */
export const startNetworkCapture = async (callback: (packet: ParsedPacket) => void): Promise<void> => {
  // Reset captured packets array when starting a new capture
  capturedPackets = [];
  
  try {
    // Create observer for network resources and performance metrics
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        if (entry.entryType === 'resource') {
          // Handle resource entries as network packets (existing logic)
          const url = entry.name;
          const initiatorType = entry.initiatorType;
          const startTime = entry.startTime;
          const duration = entry.duration;
          const size = (entry as any).transferSize || 0;
          
          const rawData = {
            url,
            initiatorType,
            startTime,
            duration,
            size,
            timestamp: new Date().toISOString()
          };
          
          const packet = createPacketFromPerformanceEntry(entry, rawData);
          capturedPackets.push(packet);
          callback(packet);
        } else {
          // Handle performance metrics (navigation, longtask, paint, etc.)
          const performanceEntryData = createPerformanceEntryData(entry);
          database.storePerformanceEntry(performanceEntryData);
          
          console.log(`Captured ${entry.entryType} performance entry:`, entry.name);
        }
      }
    });

    // Store the observer instance
    networkObserver = observer;

    // Observe multiple entry types for comprehensive performance monitoring
    try {
      observer.observe({ 
        entryTypes: [
          'resource', 
          'navigation', 
          'longtask', 
          'largest-contentful-paint',
          'paint',
          'first-input',
          'layout-shift'
        ] 
      });
    } catch (error) {
      // Fallback if some entry types aren't supported
      console.warn('Some performance entry types not supported, using fallback:', error);
      observer.observe({ entryTypes: ['resource', 'navigation'] });
    }
    
    // Trigger a test network request to demonstrate capture
    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then(response => response.json())
      .catch(err => console.error("Error making test request:", err));
      
  } catch (error) {
    console.error("Error setting up network capture:", error);
    throw error;
  }
};

/**
 * Creates a packet from a PerformanceEntry
 */
const createPacketFromPerformanceEntry = (entry: PerformanceEntry, rawData: any): ParsedPacket => {
  const packetId = uuidv4();
  const tokens: Token[] = [];
  const sections: ParsedSection[] = [];
  const fileReferences: FileReference[] = [];
  let index = 0;
  
  // Add the URL as a token
  tokens.push({
    id: uuidv4(),
    value: entry.name,
    type: 'string',
    index: index++
  });
  
  // Determine the protocol based on URL
  const url = new URL(entry.name);
  const protocol = url.protocol.replace(':', '').toUpperCase();
  
  // Extract domain parts for source/destination
  const hostParts = url.hostname.split('.');
  const domain = hostParts.length >= 2 ? 
    `${hostParts[hostParts.length - 2]}.${hostParts[hostParts.length - 1]}` : 
    url.hostname;
  
  // Add header section
  sections.push({
    id: uuidv4(),
    type: 'header',
    startIndex: 0,
    endIndex: 1,
    content: `Request to ${url.origin}${url.pathname}`
  });
  
  // Check if URL points to a file
  const pathname = url.pathname;
  const fileExtensionMatch = pathname.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  
  if (fileExtensionMatch) {
    const extension = fileExtensionMatch[1].toLowerCase();
    const fileTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'json', 'xml', 'html', 'css', 'js'];
    
    if (fileTypes.includes(extension)) {
      const fileName = pathname.split('/').pop() || 'unknown';
      fileReferences.push({
        id: uuidv4(),
        uri: entry.name,
        fileName,
        hash: SHA256(entry.name).toString(),
        downloadStatus: 'pending'
      });
    }
  }
  
  return {
    id: packetId,
    timestamp: new Date().toISOString(),
    source: window.location.hostname,
    destination: domain,
    protocol,
    tokens,
    sections,
    fileReferences,
    rawData: JSON.stringify(rawData, null, 2)
  };
};

/**
 * Stops network traffic capture
 */
export const stopNetworkCapture = (): ParsedPacket[] => {
  // Disconnect the specific observer instance instead of the constructor
  if (networkObserver) {
    networkObserver.disconnect();
    networkObserver = null;
  }
  
  // Return all captured packets so they can be loaded into the parser content viewer
  const packetsToReturn = [...capturedPackets];
  
  // Optionally clear the captured packets array after returning them
  capturedPackets = [];
  
  return packetsToReturn;
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