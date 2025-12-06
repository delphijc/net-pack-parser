import React, { useState, useMemo } from 'react';
import type { ThreatAlert } from '../types/threat';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mitreService } from '../services/mitreService';
import { useAlertStore } from '../store/alertStore';
import { getSeverityColor, SEVERITY_LEVELS } from '../utils/severity';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, CheckCircle, EyeOff } from 'lucide-react';

interface ThreatPanelProps {
  threats: ThreatAlert[];
  onThreatClick: (packetId: string) => void;
}

export const ThreatPanel: React.FC<ThreatPanelProps> = ({
  threats,
  onThreatClick,
}) => {
  const [selectedTactic, setSelectedTactic] = useState<string>('all');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'sourceIp'>(
    'timestamp',
  );
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const { markFalsePositive, confirmThreat, addNote, getAlertState } =
    useAlertStore();

  // Extract unique tactics and techniques for filters
  const { tactics, techniques } = useMemo(() => {
    const uniqueTactics = new Set<string>();
    const uniqueTechniques = new Map<string, string>(); // ID -> Name

    threats.forEach((threat) => {
      if (threat.mitreAttack) {
        threat.mitreAttack.forEach((id) => {
          const details = mitreService.getTechniqueDetails(id);
          if (details) {
            uniqueTactics.add(details.tactic);
            uniqueTechniques.set(details.id, details.name);
          }
        });
      }
    });

    return {
      tactics: Array.from(uniqueTactics).sort(),
      techniques: Array.from(uniqueTechniques.entries()).sort((a, b) =>
        a[1].localeCompare(b[1]),
      ),
    };
  }, [threats]);

  // Filter and Sort threats
  const processedThreats = useMemo(() => {
    const filtered = threats.filter((threat) => {
      const alertState = getAlertState(threat.id);

      // Hide False Positives from main view
      if (alertState?.status === 'false_positive') return false;

      // Filter by Severity
      if (selectedSeverity !== 'all' && threat.severity !== selectedSeverity)
        return false;

      // Filter by MITRE
      if (!threat.mitreAttack || threat.mitreAttack.length === 0) {
        if (selectedTactic !== 'all' || selectedTechnique !== 'all')
          return false;
      } else {
        const matchesTactic =
          selectedTactic === 'all' ||
          threat.mitreAttack.some(
            (id) =>
              mitreService.getTechniqueDetails(id)?.tactic === selectedTactic,
          );

        const matchesTechnique =
          selectedTechnique === 'all' ||
          threat.mitreAttack.includes(selectedTechnique);

        if (!matchesTactic || !matchesTechnique) return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'severity') {
        const scoreA =
          SEVERITY_LEVELS[a.severity as keyof typeof SEVERITY_LEVELS] || 0;
        const scoreB =
          SEVERITY_LEVELS[b.severity as keyof typeof SEVERITY_LEVELS] || 0;
        return scoreB - scoreA; // Descending severity
      }
      if (sortBy === 'sourceIp') {
        return (a.sourceIp || '').localeCompare(b.sourceIp || '');
      }
      return b.timestamp - a.timestamp; // Descending timestamp
    });
  }, [
    threats,
    selectedTactic,
    selectedTechnique,
    selectedSeverity,
    sortBy,
    getAlertState,
  ]);

  const handleAddNote = (id: string) => {
    if (noteInput[id]?.trim()) {
      addNote(id, noteInput[id]);
      setNoteInput((prev) => ({ ...prev, [id]: '' }));
    }
  };

  return (
    <div className="threat-panel p-4 border rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Detected Threats</h2>
        <div className="text-sm text-gray-500">
          {processedThreats.length} / {threats.length}
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {Object.keys(SEVERITY_LEVELS).map((level) => (
              <SelectItem key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTactic} onValueChange={setSelectedTactic}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tactic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tactics</SelectItem>
            {tactics.map((tactic) => (
              <SelectItem key={tactic} value={tactic}>
                {tactic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTechnique} onValueChange={setSelectedTechnique}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Technique" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Techniques</SelectItem>
            {techniques.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {id}: {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp">Time (Newest)</SelectItem>
            <SelectItem value="severity">Severity (Highest)</SelectItem>
            <SelectItem value="sourceIp">Source IP</SelectItem>
          </SelectContent>
        </Select>

        {(selectedTactic !== 'all' ||
          selectedTechnique !== 'all' ||
          selectedSeverity !== 'all') && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedTactic('all');
              setSelectedTechnique('all');
              setSelectedSeverity('all');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {processedThreats.length === 0 ? (
        <p className="text-gray-500">No threats match the current filters.</p>
      ) : (
        <ul className="space-y-2">
          {processedThreats.map((threat) => {
            const alertState = getAlertState(threat.id);
            const isConfirmed = alertState?.status === 'confirmed';

            return (
              <li
                key={threat.id}
                className={`p-3 border rounded-md ${isConfirmed ? 'bg-red-100 border-red-300' : 'bg-slate-50 hover:bg-slate-100'}`}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => onThreatClick(threat.packetId)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium text-slate-900">
                        {threat.type}
                      </span>
                      {isConfirmed && (
                        <Badge variant="destructive">CONFIRMED</Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(threat.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    {threat.description}
                  </p>
                  {threat.sourceIp && threat.destIp && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {threat.sourceIp} → {threat.destIp}
                    </p>
                  )}

                  {/* MITRE Tags */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {threat.mitreAttack &&
                      threat.mitreAttack.map((mitreId) => {
                        const technique =
                          mitreService.getTechniqueDetails(mitreId);
                        if (!technique) return null;
                        return (
                          <a
                            key={mitreId}
                            href={technique.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title={`Tactic: ${technique.tactic} | ${technique.name} - ${technique.description}`}
                          >
                            {technique.id}: {technique.name}
                          </a>
                        );
                      })}
                  </div>

                  {/* Notes Display */}
                  {alertState?.notes && alertState.notes.length > 0 && (
                    <div className="mt-2 pl-2 border-l-2 border-slate-300">
                      {alertState.notes.map((note, idx) => (
                        <p key={idx} className="text-xs text-slate-600 italic">
                          "{note}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-slate-200">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markFalsePositive(threat.id);
                      }}
                      className="text-xs"
                    >
                      <EyeOff className="w-3 h-3 mr-1" /> False Positive
                    </Button>
                    <Button
                      variant={isConfirmed ? 'secondary' : 'default'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmThreat(threat.id);
                      }}
                      disabled={isConfirmed}
                      className="text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />{' '}
                      {isConfirmed ? 'Confirmed' : 'Confirm'}
                    </Button>
                  </div>

                  {/* Add Note Input */}
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      placeholder="Add investigation note..."
                      className="h-8 text-xs"
                      value={noteInput[threat.id] || ''}
                      onChange={(e) =>
                        setNoteInput({
                          ...noteInput,
                          [threat.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNote(threat.id);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => handleAddNote(threat.id)}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
