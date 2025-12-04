// client/src/utils/directoryTraversalDetector.ts

import type { Packet } from '@/types/packet';
import type { ThreatAlert } from '@/types/threat';
import { directoryTraversalPatterns } from './directoryTraversalPatterns';
import { decodeUrl } from './xssPatterns'; // Reuse decodeUrl
import { v4 as uuidv4 } from 'uuid';

/**
 * Detects Directory Traversal attempts in a given packet.
 * @param packet The packet to analyze.
 * @returns An array of ThreatAlert objects if Directory Traversal is detected.
 */
export function detectDirectoryTraversal(packet: Packet): ThreatAlert[] {
    const detectedThreats: ThreatAlert[] = [];

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
    let detectionContexts: string[] = [];

    for (const target of scanTargets) {
        const targetMatches: { offset: number; length: number }[] = [];

        const checkPatterns = (patterns: RegExp[]) => {
            for (const pattern of patterns) {
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(target.value)) !== null) {
                    targetMatches.push({ offset: match.index, length: match[0].length });
                }
            }
        };

        checkPatterns(directoryTraversalPatterns.standardTraversal);
        checkPatterns(directoryTraversalPatterns.encodedTraversal);
        checkPatterns(directoryTraversalPatterns.absolutePaths);
        checkPatterns(directoryTraversalPatterns.sensitiveFiles);

        if (targetMatches.length > 0) {
            allMatchDetails.push(...targetMatches);
            detectionContexts.push(target.name);
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
            severity: 'high', // AC5: HIGH
            type: 'Directory Traversal',
            description: `Potential Directory Traversal detected in ${detectionContexts.join(', ')}`,
            mitreAttack: ['T1083'], // AC6: T1083
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
