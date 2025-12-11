import type { ThreatAlert } from '../types/threat';
import type { ParsedPacket } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { type IOC } from '../services/iocService';

// @ts-ignore
export async function detectIOCs(_packet: ParsedPacket): Promise<ThreatAlert[]> {
  const threats: ThreatAlert[] = [];
  // Client-side detection deprecated
  return threats;
}

// @ts-ignore
function createIOCAlert(
  packet: ParsedPacket,
  ioc: IOC,
  description: string,
): ThreatAlert {
  return {
    id: uuidv4(),
    packetId: packet.id,
    type: 'ioc_match',
    severity: ioc.severity,
    description: `${description} (${ioc.description || 'No description'})`,
    source: ioc.source || 'Internal IOC DB',
    mitreAttack: ioc.mitreAttack || [],
    timestamp: packet.timestamp,
    falsePositive: false,
    confirmed: false,
    sourceIp: packet.sourceIP,
    destIp: packet.destIP,
    sourcePort: packet.sourcePort,
    destPort: packet.destPort,
  };
}
