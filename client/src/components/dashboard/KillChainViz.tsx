import React from 'react';
import type { ThreatAlert } from '../../types/threat';
import { mitreService } from '../../services/mitreService';
import { ChevronRight } from 'lucide-react';

interface KillChainVizProps {
  threats: ThreatAlert[];
}

const ORDERED_TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Exfiltration',
  'Command and Control',
  'Impact',
];

export const KillChainViz: React.FC<KillChainVizProps> = ({ threats }) => {
  const distribution = mitreService.getTacticsDistribution(threats);

  // Filter tactics that have at least one threat
  const activeTactics = ORDERED_TACTICS.filter(
    (tactic) => distribution[tactic] > 0,
  );

  return (
    <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm border dark:border-border">
      <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">
        Attack Kill Chain Flow
      </h3>
      <div className="flex items-center overflow-x-auto pb-2">
        {activeTactics.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-muted-foreground/60">
            No kill chain activity detected.
          </p>
        ) : (
          activeTactics.map((tactic, index) => (
            <React.Fragment key={tactic}>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold mb-2 border-2 border-red-200 dark:border-red-800">
                  {distribution[tactic]}
                </div>
                <span className="text-xs font-medium text-center px-2 text-foreground">
                  {tactic}
                </span>
              </div>
              {index < activeTactics.length - 1 && (
                <div className="mx-2 text-gray-300 dark:text-slate-700">
                  <ChevronRight size={24} />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};
