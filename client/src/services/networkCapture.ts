import type { ParsedPacket, Token, ParsedSection, FileReference, PerformanceEntryData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SHA256 } from 'crypto-js';
import database from './database';

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

        default:
            // Store any additional properties
            performanceEntry.details = { ...entry };
            break;
    }

    return performanceEntry;
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
    // Extract domain parts for source/destination

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
        timestamp: Date.now(),
        sourceIP: '192.168.1.105',
        destIP: '142.250.190.46',
        sourcePort: 54321,
        destPort: 443,
        protocol: 'TCP',
        length: 64,
        rawData: new TextEncoder().encode(JSON.stringify(rawData)).buffer,
        tokens: tokens,
        sections: sections,
        fileReferences: fileReferences,
        detectedProtocols: ['TCP']
    };
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
                    const resourceEntry = entry as PerformanceResourceTiming;
                    const url = entry.name;
                    const initiatorType = resourceEntry.initiatorType;
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
