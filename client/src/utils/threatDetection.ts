// client/src/utils/threatDetection.ts

import type { Packet } from '../types/packet';
import type { ThreatAlert } from '../types/threat';
import { detectSqlInjection } from './sqlInjectionDetector';

/**
 * Orchestrates various threat detection mechanisms.
 * This function will be expanded to include other detection types (XSS, Command Injection, etc.).
 * @param packet The packet to analyze for threats.
 * @returns An array of detected ThreatAlerts.
 */
export function runThreatDetection(packet: Packet): ThreatAlert[] {
  let allThreats: ThreatAlert[] = [];

  // 1. SQL Injection Detection
  const sqlInjectionThreats = detectSqlInjection(packet);
  allThreats = allThreats.concat(sqlInjectionThreats);

  // Future integrations:
  // const xssThreats = detectXss(packet);
  // allThreats = allThreats.concat(xssThreats);

  return allThreats;
}
