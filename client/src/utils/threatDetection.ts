
import type { Packet } from '@/types/packet';
import type { ParsedPacket } from '@/types';
import type { ThreatAlert } from '@/types/threat';
import { detectSqlInjection } from './sqlInjectionDetector';
import { detectXss } from './xssDetector';
import { detectCommandInjection } from './commandInjectionDetector';
import { detectDirectoryTraversal } from './directoryTraversalDetector';
import { detectSensitiveData } from './sensitiveDataDetector';
import { detectIOCs } from './iocDetector';

/**
 * Orchestrates various threat detection mechanisms.
 * This function will be expanded to include other detection types (XSS, Command Injection, etc.).
 * @param packet The packet to analyze for threats.
 * @returns An array of detected ThreatAlerts.
 */
import { yaraEngine } from '../services/yaraEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * Orchestrates various threat detection mechanisms.
 * This function will be expanded to include other detection types (XSS, Command Injection, etc.).
 * @param packet The packet to analyze for threats.
 * @returns An array of detected ThreatAlerts.
 */
export async function runThreatDetection(
  packet: Packet,
): Promise<ThreatAlert[]> {
  let allThreats: ThreatAlert[] = [];

  // 1. SQL Injection Detection
  const sqlInjectionThreats = detectSqlInjection(packet);
  allThreats = allThreats.concat(sqlInjectionThreats);

  // Future integrations:
  const xssThreats = detectXss(packet);
  allThreats = allThreats.concat(xssThreats);

  const commandInjectionThreats = detectCommandInjection(packet);
  allThreats = allThreats.concat(commandInjectionThreats);

  const directoryTraversalThreats = detectDirectoryTraversal(packet);
  allThreats = allThreats.concat(directoryTraversalThreats);

  const sensitiveDataThreats = detectSensitiveData(packet);
  allThreats = allThreats.concat(sensitiveDataThreats);

  // YARA Scanning (Async)
  try {
    const { matches } = await yaraEngine.scanPayload(
      new Uint8Array(packet.rawData),
    );
    if (matches && matches.length > 0) {
      const yaraThreats: ThreatAlert[] = matches.map((match) => {
        const severity =
          (match.meta.severity?.toLowerCase() as
            | 'low'
            | 'medium'
            | 'high'
            | 'critical') || 'high';
        const mitre = match.meta.mitre ? [match.meta.mitre] : [];

        return {
          id: uuidv4(),
          packetId: packet.id,
          severity,
          type: 'Malware Detection',
          description: `YARA Rule Match: ${match.rule} `,
          mitreAttack: mitre,
          timestamp: packet.timestamp,
          falsePositive: false,
          confirmed: false,
          matchDetails: match.matches.map((m) => ({
            offset: m.offset,
            length: m.length,
          })),
          sourceIp: packet.sourceIP,
          destIp: packet.destIP,
          sourcePort: packet.sourcePort,
          destPort: packet.destPort,
        };
      });
      allThreats = allThreats.concat(yaraThreats);
    }
  } catch (error) {
    console.error('YARA Scan failed:', error);
  }

  // IOC Detection (Async)
  try {
    const iocThreats = await detectIOCs(packet as unknown as ParsedPacket);
    allThreats = allThreats.concat(iocThreats);
  } catch (error) {
    console.error('IOC Detection failed:', error);
  }

  return allThreats;
}
