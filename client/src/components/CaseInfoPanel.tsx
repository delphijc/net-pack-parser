import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForensicStore } from '@/store/forensicStore';
import { useSessionStore } from '@/store/sessionStore';

export const CaseInfoPanel: React.FC = () => {
  const { caseMetadata, updateCaseMetadata } = useForensicStore();
  const sessionId = useSessionStore((state) => state.activeSessionId);

  // Initialize if null
  useEffect(() => {
    if (!caseMetadata && sessionId) {
      updateCaseMetadata({
        caseId: sessionId,
        caseName: 'New Case',
        investigator: '',
        organization: '',
        summary: '',
        startDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [caseMetadata, sessionId, updateCaseMetadata]);

  if (!caseMetadata) return null;

  const handleChange = (field: keyof typeof caseMetadata, value: string) => {
    updateCaseMetadata({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Details</CardTitle>
        <CardDescription>
          Manage investigation metadata and context.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="caseName">Case Name</Label>
            <Input
              id="caseName"
              value={caseMetadata.caseName}
              onChange={(e) => handleChange('caseName', e.target.value)}
              placeholder="e.g. Operation Firewall"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caseId">Case ID</Label>
            <Input
              id="caseId"
              value={caseMetadata.caseId}
              onChange={(e) => handleChange('caseId', e.target.value)}
              placeholder="Unique Identifier"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="investigator">Investigator Name</Label>
            <Input
              id="investigator"
              value={caseMetadata.investigator}
              onChange={(e) => handleChange('investigator', e.target.value)}
              placeholder="Your Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={caseMetadata.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              placeholder="Company / Agency"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
