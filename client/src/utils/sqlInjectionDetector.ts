// client/src/utils/sqlInjectionDetector.ts

import type { Packet } from '@/types/packet';
import type { ThreatAlert } from '@/types/threat';
import {
  sqlInjectionPatterns,
  decodeUrl,
  decodeHex,
} from './sqlInjectionPatterns';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for HTTP request components relevant to SQLi detection.
 */
interface HttpRequestData {
  queryString: string;
  postData: string;
  cookieHeader: string;
  userAgentHeader: string;
}

/**
 * Extracts relevant HTTP request components from a packet's raw data.
 * @param rawData The packet's raw data as a string.
 * @returns An object containing extracted HTTP request data.
 */
function extractHttpRequestData(rawData: string): HttpRequestData {
  const data: HttpRequestData = {
    queryString: '',
    postData: '',
    cookieHeader: '',
    userAgentHeader: '',
  };

  const lines = rawData.split('\r\n');
  let inBody = false;
  let headersParsed = false; // To ensure postData only includes body after headers

  for (const line of lines) {
    if (!headersParsed) {
      if (line.startsWith('GET ')) {
        const urlMatch = line.match(/GET\s+([^?\s]+)(?:\?(.+?))?\s+HTTP/);
        if (urlMatch && urlMatch[2]) {
          data.queryString = urlMatch[2];
        }
      } else if (line.startsWith('POST ')) {
        const urlMatch = line.match(/POST\s+([^?\s]+)(?:\?(.+?))?\s+HTTP/);
        if (urlMatch && urlMatch[2]) {
          data.queryString = urlMatch[2];
        }
      } else if (line.startsWith('Cookie: ')) {
        data.cookieHeader = line.substring('Cookie: '.length);
      } else if (line.startsWith('User-Agent: ')) {
        data.userAgentHeader = line.substring('User-Agent: '.length);
      } else if (line === '') {
        headersParsed = true; // Empty line signifies end of headers
        continue;
      }
    } else if (inBody) {
      data.postData += line;
    }

    if (line.startsWith('POST ') && !inBody) {
      // Only for POST requests, start collecting body after headers
      inBody = true;
    }
  }

  return data;
}

/**
 * Applies SQL injection patterns to a given text and returns match details.
 * @param text The text to scan for SQL injection patterns.
 * @returns An array of objects with offset and length for each match.
 */
function findSqlInjectionMatches(
  text: string,
): { offset: number; length: number }[] {
  const matches: { offset: number; length: number }[] = [];

  const checkPatterns = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      // Reset lastIndex to 0 before each use to prevent state leakage
      pattern.lastIndex = 0;
      let match;
      // Use exec in a loop to find all occurrences
      while ((match = pattern.exec(text)) !== null) {
        matches.push({ offset: match.index, length: match[0].length });
      }
    }
  };

  checkPatterns(sqlInjectionPatterns.classic);
  checkPatterns(sqlInjectionPatterns.timeBased);
  checkPatterns(sqlInjectionPatterns.booleanBased);

  return matches;
}

/**
 * Detects SQL Injection attempts in a given packet.
 * @param packet The packet to analyze.
 * @returns An array of ThreatAlert objects if SQL Injection is detected.
 */
export function detectSqlInjection(packet: Packet): ThreatAlert[] {
  const detectedThreats: ThreatAlert[] = [];

  // Only analyze HTTP(S) packets
  if (
    !packet.detectedProtocols.includes('HTTP') &&
    !packet.detectedProtocols.includes('HTTPS')
  ) {
    return detectedThreats;
  }

  const rawDataString = new TextDecoder().decode(packet.rawData);
  const httpRequestData = extractHttpRequestData(rawDataString);

  const fieldsToScan = [
    { name: 'query string', value: httpRequestData.queryString },
    { name: 'post data', value: httpRequestData.postData },
    { name: 'cookie header', value: httpRequestData.cookieHeader },
    { name: 'user-agent header', value: httpRequestData.userAgentHeader },
  ];

  for (const field of fieldsToScan) {
    const allMatchDetails: { offset: number; length: number }[] = [];
    let detectionEncoding: string = 'none'; // To store the first encoding that detects something

    if (field.value) {
      // Scan original value
      const originalMatches = findSqlInjectionMatches(field.value);
      if (originalMatches.length > 0) {
        allMatchDetails.push(...originalMatches);
        detectionEncoding = 'none';
      }

      // Attempt URL decoding and scan
      const decodedUrl = decodeUrl(field.value);
      if (decodedUrl !== field.value) {
        const urlMatches = findSqlInjectionMatches(decodedUrl);
        if (urlMatches.length > 0) {
          // Adjust offsets for URL decoding if possible, or just add them.
          // For simplicity in this context, we'll add them.
          // In a real scenario, mapping back to original offsets is complex.
          // We will just add them to the list.
          allMatchDetails.push(...urlMatches);
          if (detectionEncoding === 'none') detectionEncoding = 'url';
        }
      }

      // Attempt double decoding (URL then Hex) - check this BEFORE standalone hex
      const hexPattern = /0x[0-9a-fA-F]+/g;
      if (decodedUrl !== field.value) {
        // Look for hex patterns in the URL-decoded string
        const urlHexMatches = decodedUrl.match(hexPattern);
        if (urlHexMatches) {
          for (const hexMatch of urlHexMatches) {
            const decodedUrlThenHex = decodeHex(hexMatch);
            if (decodedUrlThenHex !== hexMatch) {
              const urlHexScanMatches =
                findSqlInjectionMatches(decodedUrlThenHex);
              if (urlHexScanMatches.length > 0) {
                allMatchDetails.push(...urlHexScanMatches);
                if (detectionEncoding === 'none' || detectionEncoding === 'url')
                  detectionEncoding = 'url+hex';
              }
            }
          }
        }
      }

      // Attempt Hex decoding and scan (standalone, not after URL)
      // Look for 0x-prefixed hex patterns in the ORIGINAL string
      const hexMatches = field.value.match(hexPattern);
      if (hexMatches) {
        for (const hexMatch of hexMatches) {
          const decodedHex = decodeHex(hexMatch);
          if (decodedHex !== hexMatch) {
            const hexScanMatches = findSqlInjectionMatches(decodedHex);
            if (hexScanMatches.length > 0) {
              allMatchDetails.push(...hexScanMatches);
              if (detectionEncoding === 'none') detectionEncoding = 'hex';
            }
          }
        }
      }
    }

    if (allMatchDetails.length > 0) {
      // Deduplicate matches based on offset and length
      const uniqueMatches = allMatchDetails.filter(
        (match, index, self) =>
          index ===
          self.findIndex(
            (m) => m.offset === match.offset && m.length === match.length,
          ),
      );

      detectedThreats.push({
        id: uuidv4(),
        packetId: packet.id,
        severity: 'critical',
        type: 'SQL Injection',
        description: `Potential SQL Injection detected in ${field.name} (encoding: ${detectionEncoding})`,
        mitreAttack: ['T1190'],
        timestamp: packet.timestamp,
        falsePositive: false,
        confirmed: false,
        matchDetails: uniqueMatches,
        sourceIp: packet.sourceIP,
        destIp: packet.destIP,
      });
    }
  }

  return detectedThreats;
}
