// client/src/utils/xssDetector.ts

import type { Packet } from '@/types/packet';
import type { ThreatAlert } from '@/types/threat';
import { xssPatterns, decodeUrl, decodeHtmlEntities } from './xssPatterns';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for HTTP request components relevant to XSS detection.
 */
interface HttpRequestData {
  queryString: string;
  postData: string;
  cookieHeader: string;
  userAgentHeader: string;
  refererHeader: string;
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
    refererHeader: '',
  };

  const lines = rawData.split('\r\n');
  let inBody = false;
  let headersParsed = false;

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
      } else if (line.startsWith('Referer: ')) {
        data.refererHeader = line.substring('Referer: '.length);
      } else if (line === '') {
        headersParsed = true;
        continue;
      }
    } else if (inBody) {
      data.postData += line;
    }

    if (line.startsWith('POST ') && !inBody) {
      inBody = true;
    }
  }

  return data;
}

/**
 * Applies XSS patterns to a given text and returns match details.
 * @param text The text to scan for XSS patterns.
 * @returns An array of objects with offset and length for each match.
 */
function findXssMatches(text: string): { offset: number; length: number }[] {
  const matches: { offset: number; length: number }[] = [];

  const checkPatterns = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push({ offset: match.index, length: match[0].length });
      }
    }
  };

  checkPatterns(xssPatterns.scriptTags);
  checkPatterns(xssPatterns.eventHandlers);
  checkPatterns(xssPatterns.javascriptUris);
  checkPatterns(xssPatterns.dataUris);
  checkPatterns(xssPatterns.polyglots);

  return matches;
}

/**
 * Detects XSS attempts in a given packet.
 * @param packet The packet to analyze.
 * @returns An array of ThreatAlert objects if XSS is detected.
 */
export function detectXss(packet: Packet): ThreatAlert[] {
  const detectedThreats: ThreatAlert[] = [];

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
    { name: 'referer header', value: httpRequestData.refererHeader },
  ];

  for (const field of fieldsToScan) {
    const allMatchDetails: { offset: number; length: number }[] = [];
    let detectionEncoding: string = 'none';

    if (field.value) {
      // 1. Scan original value
      const originalMatches = findXssMatches(field.value);
      if (originalMatches.length > 0) {
        allMatchDetails.push(...originalMatches);
        detectionEncoding = 'none';
      }

      // 2. Scan URL decoded value
      const decodedUrl = decodeUrl(field.value);
      if (decodedUrl !== field.value) {
        const urlMatches = findXssMatches(decodedUrl);
        if (urlMatches.length > 0) {
          allMatchDetails.push(...urlMatches);
          if (detectionEncoding === 'none') detectionEncoding = 'url';
        }
      }

      // 3. Scan HTML Entity decoded value (often inside URL decoded params)
      const decodedHtml = decodeHtmlEntities(decodedUrl);
      if (decodedHtml !== decodedUrl) {
        const htmlMatches = findXssMatches(decodedHtml);
        if (htmlMatches.length > 0) {
          allMatchDetails.push(...htmlMatches);
          if (detectionEncoding === 'none' || detectionEncoding === 'url')
            detectionEncoding = 'html-entity';
        }
      }
    }

    if (allMatchDetails.length > 0) {
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
        severity: 'high', // AC4: Severity HIGH
        type: 'Cross-Site Scripting (XSS)', // AC4: Type XSS
        description: `Potential XSS detected in ${field.name} (encoding: ${detectionEncoding})`,
        mitreAttack: ['T1059.007'], // AC4: MITRE T1059.007
        timestamp: packet.timestamp,
        falsePositive: false,
        confirmed: false,
        matchDetails: uniqueMatches,
        sourceIp: packet.sourceIP,
        destIp: packet.destIP,
        sourcePort: packet.sourcePort,
        destPort: packet.destPort,
      });
    }
  }

  return detectedThreats;
}
