import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useForensicStore } from '@/store/forensicStore';

export const SummaryEditor: React.FC = () => {
  const { caseMetadata, updateCaseMetadata } = useForensicStore();

  if (!caseMetadata) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Executive Summary</CardTitle>
        <CardDescription>
          Record high-level findings, objectives, and conclusions. Content will
          be included in the forensic report.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-[300px]">
        <Textarea
          className="flex-grow font-mono resize-none p-4"
          placeholder="## Investigation Objectives&#10;- Identify source of intrusion&#10;- Determine scope of data exfiltration&#10;&#10;## Findings&#10;..."
          value={caseMetadata.summary}
          onChange={(e) => updateCaseMetadata({ summary: e.target.value })}
        />
      </CardContent>
    </Card>
  );
};
