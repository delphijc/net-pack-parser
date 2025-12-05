import mitreData from '../data/mitreAttack.json';
import type { ThreatAlert } from '../types/threat';

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  url: string;
  description: string;
}

export const mitreService = {
  getTechniqueDetails: (id: string): MitreTechnique | undefined => {
    return mitreData.techniques.find((t) => t.id === id);
  },

  getAllTechniques: (): MitreTechnique[] => {
    return mitreData.techniques;
  },

  getTacticsDistribution: (threats: ThreatAlert[]): Record<string, number> => {
    const distribution: Record<string, number> = {};

    threats.forEach((threat) => {
      if (threat.mitreAttack && threat.mitreAttack.length > 0) {
        threat.mitreAttack.forEach((techniqueId) => {
          const technique = mitreService.getTechniqueDetails(techniqueId);
          if (technique) {
            const tactic = technique.tactic;
            distribution[tactic] = (distribution[tactic] || 0) + 1;
          } else {
            // Handle unknown techniques or group them
            distribution['Unknown'] = (distribution['Unknown'] || 0) + 1;
          }
        });
      }
    });

    return distribution;
  },

  getTopTechniques: (
    threats: ThreatAlert[],
    limit: number = 10,
  ): { technique: MitreTechnique; count: number }[] => {
    const counts: Record<string, number> = {};

    threats.forEach((threat) => {
      if (threat.mitreAttack) {
        threat.mitreAttack.forEach((id) => {
          counts[id] = (counts[id] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const technique = mitreService.getTechniqueDetails(id);
        if (!technique) return null;
        return { technique, count };
      })
      .filter(
        (item): item is { technique: MitreTechnique; count: number } =>
          item !== null,
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
};
