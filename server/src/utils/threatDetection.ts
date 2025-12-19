import { v4 as uuidv4 } from 'uuid';

export interface ThreatAlert {
  id: string;
  packetId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  mitreAttack: string[];
  timestamp: number;
  sourceIp: string | null;
  destIp: string | null;
  sourcePort: number;
  destPort: number;
  matchDetails?: { offset: number; length: number }[];
}

// Patterns adapted from client logic
const SQL_INJECTION_PATTERNS = [
  /UNION\s+SELECT/i,
  /OR\s+1=1/i,
  /DROP\s+TABLE/i,
  /INSERT\s+INTO/i,
  /UPDATE\s+.*SET/i,
  /--/, // Comment - prone to false positives, be careful or keep severity low
];

const XSS_PATTERNS = [
  /<script>/i,
  /javascript:/i,
  /onload=/i,
  /onerror=/i,
  /alert\(/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /;\s*(?:cat|ls|pwd|whoami)\b/,
  /\|\s*(?:cat|ls|pwd|whoami)\b/,
  /`.*(?:cat|ls|pwd|whoami).*`/,
];

const SENSITIVE_DATA_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b(?:\d[ -]*?){13,16}\b/, // Credit Card (Simple)
];

export function runThreatDetection(
  packet: any,
  rawData: Buffer,
): ThreatAlert[] {
  const alerts: ThreatAlert[] = [];
  const payloadString = rawData.toString('utf-8');

  const addAlert = (
    type: string,
    description: string,
    severity: ThreatAlert['severity'],
    mitre: string[],
  ) => {
    alerts.push({
      id: uuidv4(),
      packetId: String(packet.id),
      severity,
      type,
      description,
      mitreAttack: mitre,
      timestamp: packet.timestamp.getTime
        ? packet.timestamp.getTime()
        : new Date(packet.timestamp).getTime(),
      sourceIp: packet.sourceIp,
      destIp: packet.destIp,
      sourcePort: 0, // Need to parse from packet? Or keep 0 if unknown
      destPort: 0,
    });
  };

  // SQL Injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(payloadString)) {
      addAlert('Injection', 'Possible SQL Injection Detected', 'high', [
        'T1190',
      ]);
      break; // Report once per type
    }
  }

  // XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(payloadString)) {
      addAlert('Cross-Site Scripting', 'Possible XSS Detected', 'medium', [
        'T1059.007',
      ]);
      break;
    }
  }

  // Command Injection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(payloadString)) {
      addAlert(
        'Command Injection',
        'Possible OS Command Injection Detected',
        'critical',
        ['T1059.004'],
      );
      break;
    }
  }

  // Sensitive Data
  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    if (pattern.test(payloadString)) {
      addAlert(
        'Sensitive Data',
        'Potential PII/Credit Card Data Exposed',
        'high',
        ['T1001'],
      );
      break;
    }
  }

  return alerts;
}
