// client/src/utils/sensitiveDataDetector.ts

import type { Packet } from '@/types/packet';
import type { ThreatAlert } from '@/types/threat';
import { sensitiveDataPatterns, validateLuhn } from './sensitiveDataPatterns';
import { decodeUrl } from './xssPatterns'; // Reuse decodeUrl
import { v4 as uuidv4 } from 'uuid';

/**
 * Detects Sensitive Data Exposure in a given packet.
 * @param packet The packet to analyze.
 * @returns An array of ThreatAlert objects if sensitive data is detected.
 */
export function detectSensitiveData(packet: Packet): ThreatAlert[] {
  const detectedThreats: ThreatAlert[] = [];

  // Scan all packets, but focus on HTTP/S for now as per other detectors
  if (
    !packet.detectedProtocols.includes('HTTP') &&
    !packet.detectedProtocols.includes('HTTPS')
  ) {
    return detectedThreats;
  }

  const rawDataString = new TextDecoder().decode(packet.rawData);

  const scanTargets = [
    { name: 'raw payload', value: rawDataString },
    { name: 'url decoded payload', value: decodeUrl(rawDataString) },
  ];

  const allMatchDetails: { offset: number; length: number }[] = [];
  const foundSensitiveData: {
    type: string;
    value: string;
    redacted: string;
  }[] = [];
  const detectionContexts: string[] = [];

  for (const target of scanTargets) {
    const targetMatches: { offset: number; length: number }[] = [];
    const targetSensitiveData: {
      type: string;
      value: string;
      redacted: string;
    }[] = [];

    const checkPattern = (
      pattern: RegExp,
      type: string,
      validator?: (val: string) => boolean,
    ) => {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(target.value)) !== null) {
        const fullMatch = match[0];

        // Optional validation (e.g., Luhn)
        if (validator && !validator(fullMatch)) {
          continue;
        }

        targetMatches.push({ offset: match.index, length: fullMatch.length });

        // Redaction logic
        let redacted = fullMatch;
        if (fullMatch.length > 8) {
          const first4 = fullMatch.substring(0, 4);
          const last4 = fullMatch.substring(fullMatch.length - 4);
          redacted = `${first4}...${last4}`;
        } else {
          redacted = '***REDACTED***';
        }

        targetSensitiveData.push({ type, value: fullMatch, redacted });
      }
    };

    checkPattern(
      sensitiveDataPatterns.creditCard,
      'Credit Card Number',
      validateLuhn,
    );
    checkPattern(sensitiveDataPatterns.ssn, 'SSN');
    checkPattern(sensitiveDataPatterns.awsAccessKey, 'AWS Access Key');
    checkPattern(sensitiveDataPatterns.awsSecretKey, 'AWS Secret Key');
    checkPattern(sensitiveDataPatterns.githubToken, 'GitHub Token');
    checkPattern(sensitiveDataPatterns.googleApiKey, 'Google API Key');
    checkPattern(sensitiveDataPatterns.stripeKey, 'Stripe Key');
    checkPattern(sensitiveDataPatterns.privateKey, 'Private Key');
    checkPattern(sensitiveDataPatterns.email, 'Email Address');

    if (targetSensitiveData.length > 0) {
      allMatchDetails.push(...targetMatches);
      foundSensitiveData.push(...targetSensitiveData);
      detectionContexts.push(target.name);
    }
  }

  if (foundSensitiveData.length > 0) {
    // Deduplicate matches based on offset/length
    const uniqueMatches = allMatchDetails.filter(
      (match, index, self) =>
        index ===
        self.findIndex(
          (m) => m.offset === match.offset && m.length === match.length,
        ),
    );

    // Deduplicate found data (to avoid showing same CC twice if found in raw and decoded)
    const uniqueSensitiveData = foundSensitiveData.filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.value === item.value && t.type === item.type),
    );

    // Determine severity
    const isCritical = uniqueSensitiveData.some((item) =>
      [
        'AWS Access Key',
        'AWS Secret Key',
        'GitHub Token',
        'Google API Key',
        'Stripe Key',
        'Private Key',
      ].includes(item.type),
    );

    // Construct description with REDACTED values
    const descriptions = uniqueSensitiveData.map(
      (item) => `${item.type}: ${item.redacted}`,
    );
    const uniqueDescriptions = [...new Set(descriptions)]; // Deduplicate descriptions

    // Aggregate raw sensitive data for "Reveal" functionality
    const rawDataDump = uniqueSensitiveData
      .map((item) => `${item.type}: ${item.value}`)
      .join('\n');

    detectedThreats.push({
      id: uuidv4(),
      packetId: packet.id,
      severity: isCritical ? 'critical' : 'high',
      type: 'Sensitive Data Exposure',
      description: `Potential Sensitive Data detected in ${detectionContexts.join(', ')}: ${uniqueDescriptions.join(', ')}`,
      mitreAttack: ['T1552.001'],
      timestamp: packet.timestamp,
      falsePositive: false,
      confirmed: false,
      matchDetails: uniqueMatches,
      sourceIp: packet.sourceIP,
      destIp: packet.destIP,
      sourcePort: packet.sourcePort,
      destPort: packet.destPort,
      sensitiveData: rawDataDump, // Store raw data here
    });
  }

  return detectedThreats;
}
