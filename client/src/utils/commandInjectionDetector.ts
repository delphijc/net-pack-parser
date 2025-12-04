// client/src/utils/commandInjectionDetector.ts

import type { Packet } from '@/types/packet';
import type { ThreatAlert } from '@/types/threat';
import { commandInjectionPatterns } from './commandInjectionPatterns';
import { decodeUrl } from './xssPatterns'; // Reuse decodeUrl
import { v4 as uuidv4 } from 'uuid';

/**
 * Detects Command Injection attempts in a given packet.
 * @param packet The packet to analyze.
 * @returns An array of ThreatAlert objects if Command Injection is detected.
 */
export function detectCommandInjection(packet: Packet): ThreatAlert[] {
    const detectedThreats: ThreatAlert[] = [];

    // Only analyze HTTP(S) packets (simplified for now, could apply to others)
    if (
        !packet.detectedProtocols.includes('HTTP') &&
        !packet.detectedProtocols.includes('HTTPS')
    ) {
        return detectedThreats;
    }

    const rawDataString = new TextDecoder().decode(packet.rawData);

    // We scan the entire raw data for simplicity and coverage, 
    // but in a real scenario we might target specific fields like XSS/SQLi detectors.
    // Given the nature of command injection (headers, body, params), full scan is acceptable for this scope.

    const scanTargets = [
        { name: 'raw payload', value: rawDataString },
        { name: 'url decoded payload', value: decodeUrl(rawDataString) },
    ];

    const allMatchDetails: { offset: number; length: number }[] = [];
    let detectionContexts: string[] = [];

    for (const target of scanTargets) {
        const targetMatches: { offset: number; length: number }[] = [];

        const checkPatterns = (patterns: RegExp[]) => {
            for (const pattern of patterns) {
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(target.value)) !== null) {
                    // If we are scanning decoded content, the offset might not match raw data exactly.
                    // For this implementation, we'll use the index found. 
                    // In a production system, we'd map back to original offsets.
                    targetMatches.push({ offset: match.index, length: match[0].length });
                }
            }
        };

        checkPatterns(commandInjectionPatterns.shellCommands);
        checkPatterns(commandInjectionPatterns.windowsCommands);
        checkPatterns(commandInjectionPatterns.powerShell);

        if (targetMatches.length > 0) {
            allMatchDetails.push(...targetMatches);
            detectionContexts.push(target.name);
        }
    }

    if (allMatchDetails.length > 0) {
        // Deduplicate
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
            severity: 'critical', // AC5: CRITICAL
            type: 'Command Injection',
            description: `Potential Command Injection detected in ${detectionContexts.join(', ')}`,
            mitreAttack: ['T1059'], // AC6: T1059
            timestamp: packet.timestamp,
            falsePositive: false,
            confirmed: false,
            matchDetails: uniqueMatches,
            sourceIp: packet.sourceIP,
            destIp: packet.destIP,
        });
    }

    return detectedThreats;
}
