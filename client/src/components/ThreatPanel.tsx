// client/src/components/ThreatPanel.tsx
import React from 'react';
import type { ThreatAlert } from '../types/threat';
import { Button } from '@/components/ui/button'; // Import Button component

interface ThreatPanelProps {
  threats: ThreatAlert[];
  onThreatClick: (packetId: string) => void;
  onUpdateThreatStatus: (
    threatId: string,
    status: 'falsePositive' | 'confirmed',
  ) => void; // New prop
}

export const ThreatPanel: React.FC<ThreatPanelProps> = ({
  threats,
  onThreatClick,
  onUpdateThreatStatus,
}) => {
  return (
    <div className="threat-panel p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">Detected Threats</h2>
      {threats.length === 0 ? (
        <p className="text-gray-500">No threats detected.</p>
      ) : (
        <ul className="space-y-2">
          {threats.map((threat) => (
            <li
              key={threat.id}
              className="p-3 border rounded-md bg-red-50 hover:bg-red-100"
            >
              <div
                className="cursor-pointer"
                onClick={() => onThreatClick(threat.packetId)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-red-700">
                    {threat.type} ({threat.severity})
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(threat.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  {threat.description}
                </p>
                {threat.sourceIp && threat.destIp && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {threat.sourceIp} → {threat.destIp}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  MITRE ATT&CK: {threat.mitreAttack.join(', ')}
                </p>
                {threat.sensitiveData && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle reveal logic would go here, but for now we'll just alert or console log
                        // In a real app, we'd use local state to toggle visibility of a pre-rendered hidden element
                        // or use a dialog. Let's use a simple alert for this MVP confirmation step as per AC6.
                        if (
                          window.confirm(
                            'Are you sure you want to reveal this sensitive data? Ensure you are in a secure environment.',
                          )
                        ) {
                          alert(threat.sensitiveData);
                        }
                      }}
                    >
                      Show Sensitive Data
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent onThreatClick from firing
                    onUpdateThreatStatus(threat.id, 'falsePositive');
                  }}
                  disabled={threat.falsePositive}
                >
                  {threat.falsePositive
                    ? 'False Positive (Marked)'
                    : 'Mark as False Positive'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent onThreatClick from firing
                    onUpdateThreatStatus(threat.id, 'confirmed');
                  }}
                  disabled={threat.confirmed}
                >
                  {threat.confirmed
                    ? 'Confirmed (Marked)'
                    : 'Mark as Confirmed'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
