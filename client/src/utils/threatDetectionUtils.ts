// client/src/utils/threatDetectionUtils.ts

import type { ThreatAlert } from '@/types/threat';

/**
 * Extracts and flattens all matchDetails (highlight ranges) from an array of ThreatAlerts.
 * This is used to combine highlight information from various threat detections for UI rendering.
 * @param threats An array of ThreatAlert objects.
 * @returns A flattened array of { offset: number; length: number } for highlighting.
 */
export function getThreatHighlightRanges(
  threats: ThreatAlert[],
): { offset: number; length: number }[] {
  const allRanges: { offset: number; length: number }[] = [];
  for (const threat of threats) {
    if (threat.matchDetails) {
      allRanges.push(...threat.matchDetails);
    }
  }
  return allRanges;
}
