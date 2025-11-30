import type {
  ParsedPacket,
  SuspiciousIndicator,
  ThreatIntelligence,
  ForensicMetadata,
  TimelineEvent,
  ChainOfCustodyEntry,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

// Threat Intelligence Database (simplified for demo)
const KNOWN_THREATS = [
  { domain: 'malicious-site.com', type: 'malicious_domain', severity: 'high' },
  { ip: '192.168.1.100', type: 'malicious_ip', severity: 'critical' },
  { pattern: 'eval\\(', type: 'malware_signature', severity: 'high' },
  { pattern: 'base64_decode', type: 'suspicious_pattern', severity: 'medium' },
];

// Suspicious patterns for detection
const SUSPICIOUS_PATTERNS = [
  {
    pattern: /(?:union|select|insert|update|delete|drop)\s+/i,
    type: 'sql_injection',
    severity: 'high',
  },
  {
    pattern: /<script[^>]*>.*?<\/script>/i,
    type: 'xss_attempt',
    severity: 'high',
  },
  {
    pattern: /(?:cmd|powershell|bash|sh)\s+/i,
    type: 'command_injection',
    severity: 'critical',
  },
  {
    pattern: /[A-Za-z0-9+/]{50,}={0,2}/g,
    type: 'base64_content',
    severity: 'medium',
  },
  {
    pattern: /password\s*[:=]\s*\w+/i,
    type: 'credential_exposure',
    severity: 'high',
  },
];

const UNUSUAL_PORTS = [1337, 4444, 5555, 8080, 9999, 31337];

/**
 * Validates a URL string
 */
export const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Maps indicator types to MITRE ATT&CK tactics
 */
const getMitreTactic = (type: string): string => {
  const tactics: Record<string, string> = {
    sql_injection: 'TA0001', // Initial Access
    xss_attempt: 'TA0001', // Initial Access
    command_injection: 'TA0002', // Execution
    data_exfiltration: 'TA0010', // Exfiltration
    credential_exposure: 'TA0006', // Credential Access
  };
  return tactics[type] || 'TA0007'; // Discovery (default)
};

/**
 * Maps indicator types to MITRE ATT&CK techniques
 */
const getMitreTechnique = (type: string): string => {
  const techniques: Record<string, string> = {
    sql_injection: 'T1190', // Exploit Public-Facing Application
    xss_attempt: 'T1190', // Exploit Public-Facing Application
    command_injection: 'T1059', // Command and Scripting Interpreter
    data_exfiltration: 'T1041', // Exfiltration Over C2 Channel
    credential_exposure: 'T1552', // Unsecured Credentials
  };
  return techniques[type] || 'T1082'; // System Information Discovery (default)
};

/**
 * Analyzes packet for suspicious indicators
 */
export const analyzeSuspiciousIndicators = (
  packet: ParsedPacket,
): SuspiciousIndicator[] => {
  const indicators: SuspiciousIndicator[] = [];
  const rawDataString = new TextDecoder().decode(
    new Uint8Array(packet.rawData),
  );

  // Check for suspicious patterns
  SUSPICIOUS_PATTERNS.forEach(({ pattern, type, severity }) => {
    const matches = rawDataString.match(pattern);
    if (matches) {
      indicators.push({
        id: uuidv4(),
        type: type as any,
        severity: severity as any,
        description: `Detected ${type.replace('_', ' ')} pattern: ${matches[0]}`,
        evidence: matches[0],
        confidence: 85,
        mitreTactic: getMitreTactic(type),
        mitreTechnique: getMitreTechnique(type),
      });
    }
  });

  // Check for unusual ports
  // This pattern looks for URLs with a specific port, e.g., http://host:port
  const urlMatches = rawDataString.match(/https?:\/\/[^:]+:(\d+)/g);
  if (urlMatches) {
    urlMatches.forEach((url) => {
      const port = parseInt(url.split(':').pop() || '0');
      if (UNUSUAL_PORTS.includes(port)) {
        indicators.push({
          id: uuidv4(),
          type: 'unusual_port',
          severity: 'medium',
          description: `Communication on unusual port: ${port}`,
          evidence: url,
          confidence: 70,
        });
      }
    });
  }

  // Check for large data transfers (potential exfiltration)
  if (packet.rawData.byteLength > 10000) {
    // Use byteLength for ArrayBuffer
    indicators.push({
      id: uuidv4(),
      type: 'data_exfiltration',
      severity: 'medium',
      description: `Large data transfer detected: ${packet.rawData.byteLength} bytes`,
      evidence: `Data size: ${packet.rawData.byteLength} bytes`,
      confidence: 60,
    });
  }

  return indicators;
};

/**
 * Checks packet against threat intelligence
 */
export const checkThreatIntelligence = (
  packet: ParsedPacket,
): ThreatIntelligence[] => {
  const threats: ThreatIntelligence[] = [];
  const rawDataString = new TextDecoder().decode(
    new Uint8Array(packet.rawData),
  );

  KNOWN_THREATS.forEach((threat) => {
    if (threat.domain && rawDataString.includes(threat.domain)) {
      threats.push({
        id: uuidv4(),
        type: threat.type as any,
        value: threat.domain,
        severity: threat.severity as any,
        source: 'Internal Database',
        description: `Known malicious domain detected: ${threat.domain}`,
        lastUpdated: new Date().toISOString(),
      });
    }

    if (
      threat.ip &&
      (packet.sourceIP.includes(threat.ip) || packet.destIP.includes(threat.ip))
    ) {
      threats.push({
        id: uuidv4(),
        type: threat.type as any,
        value: threat.ip,
        severity: threat.severity as any,
        source: 'Internal Database',
        description: `Known malicious IP detected: ${threat.ip}`,
        lastUpdated: new Date().toISOString(),
      });
    }
  });

  return threats;
};

/**
 * Creates forensic metadata for a packet
 */
export const createForensicMetadata = (
  packet: ParsedPacket,
  investigator?: string,
): ForensicMetadata => {
  const chainOfCustodyEntry: ChainOfCustodyEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action: 'acquired',
    investigator: investigator || 'System',
    notes: 'Packet captured and processed',
    location: 'Digital Forensics Workstation',
  };

  return {
    acquisitionTimestamp: new Date().toISOString(),
    md5Hash: CryptoJS.MD5(CryptoJS.lib.WordArray.create(packet.rawData))
      .toString()
      .substring(0, 32), // Simplified MD5 simulation
    sha256Hash: CryptoJS.SHA256(
      CryptoJS.lib.WordArray.create(packet.rawData),
    ).toString(),
    sourceDevice: 'Network Interface',
    investigator: investigator || 'System',
    chainOfCustody: [chainOfCustodyEntry],
  };
};

/**
 * Creates timeline events from packets
 */
export const createTimelineEvent = (packet: ParsedPacket): TimelineEvent => {
  let severity: 'info' | 'warning' | 'critical' = 'info';

  if (packet.suspiciousIndicators && packet.suspiciousIndicators.length > 0) {
    const maxSeverity = packet.suspiciousIndicators.reduce(
      (max, indicator) => {
        if (indicator.severity === 'critical') return 'critical';
        if (indicator.severity === 'high' && max !== 'critical')
          return 'warning';
        return max;
      },
      'info' as 'info' | 'warning' | 'critical',
    );
    severity = maxSeverity;
  }

  // Convert rawData for evidence to avoid issues with non-string types
  const evidenceRawData = new TextDecoder().decode(
    new Uint8Array(packet.rawData),
  );

  return {
    id: uuidv4(),
    timestamp: new Date(packet.timestamp).toISOString(),
    type: 'network_activity',
    source: packet.sourceIP, // Use sourceIP
    destination: packet.destIP, // Use destIP
    description: `${packet.protocol} communication from ${packet.sourceIP} to ${packet.destIP}`,
    severity,
    packetId: packet.id,
    evidence: [evidenceRawData.substring(0, 200) + '...'],
  };
};
