import React from 'react';
import type { ThreatAlert } from '../types/threat';
import { useAlertStore } from '../store/alertStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { getSeverityColor } from '../utils/severity';

interface FalsePositivesTabProps {
    threats: ThreatAlert[];
}

export const FalsePositivesTab: React.FC<FalsePositivesTabProps> = ({ threats }) => {
    const { getAlertState, restoreAlert } = useAlertStore();

    const falsePositives = threats.filter(
        (threat) => getAlertState(threat.id)?.status === 'false_positive'
    );

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">False Positives</h2>
            <p className="text-sm text-gray-500 mb-6">
                These threats have been marked as false positives and are hidden from the main dashboard.
            </p>

            {falsePositives.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-slate-50">
                    <p className="text-gray-500">No false positives marked.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {falsePositives.map((threat) => (
                        <div
                            key={threat.id}
                            className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge className={getSeverityColor(threat.severity)}>
                                        {threat.severity.toUpperCase()}
                                    </Badge>
                                    <span className="font-medium">{threat.type}</span>
                                </div>
                                <p className="text-sm text-gray-600">{threat.description}</p>
                                <div className="text-xs text-gray-400 mt-1">
                                    {new Date(threat.timestamp).toLocaleString()} | {threat.sourceIp} → {threat.destIp}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restoreAlert(threat.id)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Restore to Dashboard
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
