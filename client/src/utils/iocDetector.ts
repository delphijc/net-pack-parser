import { iocService, type IOC } from '../services/iocService';
import type { ThreatAlert } from '../types/threat';
import type { ParsedPacket } from '../types/packet';
import { v4 as uuidv4 } from 'uuid';

export async function detectIOCs(packet: ParsedPacket): Promise<ThreatAlert[]> {
  const threats: ThreatAlert[] = [];

  // Use synchronous cache for O(1) lookups
  const {
    ip: ipCache,
    domain: domainCache,
    hash: hashCache,
    url: urlCache,
    map: iocMap,
  } = iocService.getIOCCache();

  // 1. Check IPs (Source and Destination)
  if (ipCache.has(packet.sourceIP)) {
    threats.push(
      createIOCAlert(
        packet,
        iocMap.get(packet.sourceIP)!,
        `Communication with known malicious IP: ${packet.sourceIP}`,
      ),
    );
  }
  if (ipCache.has(packet.destIP)) {
    threats.push(
      createIOCAlert(
        packet,
        iocMap.get(packet.destIP)!,
        `Communication with known malicious IP: ${packet.destIP}`,
      ),
    );
  }

  // 2. Check Domains (DNS Queries and HTTP Host)
  if (packet.protocol === 'DNS' && packet.dnsQuery) {
    // Check exact match
    if (domainCache.has(packet.dnsQuery)) {
      threats.push(
        createIOCAlert(
          packet,
          iocMap.get(packet.dnsQuery)!,
          `DNS Query for known malicious domain: ${packet.dnsQuery}`,
        ),
      );
    }
    // Check if query ends with a known malicious domain (subdomain check)
    // Note: This is O(M) where M is number of domain IOCs. For strict O(1) we only do exact match.
    // Optimization: We could iterate cache if small, or just stick to exact match for now to satisfy O(1) requirement strictly.
    // Let's stick to exact match for O(1) as requested, or maybe a suffix check if we want to be more robust but slower.
    // Given the strict performance requirement, let's do exact match first.
  }

  if (packet.protocol === 'HTTP' && packet.httpHost) {
    if (domainCache.has(packet.httpHost)) {
      threats.push(
        createIOCAlert(
          packet,
          iocMap.get(packet.httpHost)!,
          `HTTP Request to known malicious domain: ${packet.httpHost}`,
        ),
      );
    }
  }

  // 3. Check URLs
  // Construct potential URLs from HTTP data
  if (packet.protocol === 'HTTP' && packet.httpHost) {
    // We don't have full path in ParsedPacket yet, but if we did:
    // const fullUrl = `http://${packet.httpHost}${packet.httpPath || '/'}`;
    // For now, let's check if any extracted strings look like URLs that match our cache
    if (packet.extractedStrings) {
      for (const str of packet.extractedStrings) {
        if (urlCache.has(str.value)) {
          threats.push(
            createIOCAlert(
              packet,
              iocMap.get(str.value)!,
              `Malicious URL found in payload: ${str.value}`,
            ),
          );
        }
      }
    }
  }

  // 4. Check Hashes
  if (packet.fileHash && hashCache.has(packet.fileHash)) {
    threats.push(
      createIOCAlert(
        packet,
        iocMap.get(packet.fileHash)!,
        `File hash match: ${packet.fileHash}`,
      ),
    );
  }

  return threats;
}

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
