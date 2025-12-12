import React from 'react';
import type { ThreatAlert } from '../../types/threat';
import { mitreService } from '../../services/mitreService';

interface TopTechniquesTableProps {
  threats: ThreatAlert[];
}

export const TopTechniquesTable: React.FC<TopTechniquesTableProps> = ({
  threats,
}) => {
  const topTechniques = mitreService.getTopTechniques(threats);

  return (
    <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm border dark:border-border h-[300px] overflow-auto">
      <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">
        Top Observed Techniques
      </h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b dark:border-border">
            <th className="text-left py-2 font-medium text-gray-500 dark:text-muted-foreground">ID</th>
            <th className="text-left py-2 font-medium text-gray-500 dark:text-muted-foreground">
              Technique
            </th>
            <th className="text-right py-2 font-medium text-gray-500 dark:text-muted-foreground">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-800">
          {topTechniques.map(({ technique, count }) => (
            <tr
              key={technique.id}
              className="border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
            >
              <td className="py-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                <a
                  href={technique.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {technique.id}
                </a>
              </td>
              <td className="py-2 text-foreground">{technique.name}</td>
              <td className="py-2 text-right font-medium text-foreground">{count}</td>
            </tr>
          ))}
          {topTechniques.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-400 dark:text-muted-foreground/60">
                No techniques observed yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
