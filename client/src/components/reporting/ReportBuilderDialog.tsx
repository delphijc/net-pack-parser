import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  ReportConfig,
  ReportSectionType,
} from '@/services/ReportGenerator';

interface ReportBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: ReportConfig) => Promise<void>;
  defaultSummary?: string;
}

export const ReportBuilderDialog: React.FC<ReportBuilderDialogProps> = ({
  open,
  onOpenChange,
  onGenerate,
  defaultSummary,
}) => {
  const [sections, setSections] = useState<ReportSectionType[]>([
    'summary',
    'stats',
    'protocol',
    'timeline',
    'toptalkers',
    'geomap',
    'threats',
    'coc',
  ]);
  const [customSummary, setCustomSummary] = useState(defaultSummary || '');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (defaultSummary) {
      setCustomSummary(defaultSummary);
    }
  }, [defaultSummary]);

  const toggleSection = (section: ReportSectionType) => {
    setSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate({
        sections,
        customSummary: customSummary.trim() || undefined,
      });
      onOpenChange(false);
    } catch (e) {
      console.error('Generation failed', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const availableSections: { id: ReportSectionType; label: string }[] = [
    { id: 'summary', label: 'Executive Summary' },
    { id: 'stats', label: 'Capture Statistics' },
    { id: 'protocol', label: 'Protocol Distribution Chart' },
    { id: 'timeline', label: 'Traffic Volume Timeline' },
    { id: 'toptalkers', label: 'Top Talkers' },
    { id: 'geomap', label: 'Geographic Map' },
    { id: 'threats', label: 'Threats Detected Log' },
    { id: 'coc', label: 'Chain of Custody Log' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Customize sections to include in your PDF report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Sections</h4>
            {availableSections.map((section) => (
              <div key={section.id} className="flex items-center space-x-2">
                <Checkbox
                  id={section.id}
                  checked={sections.includes(section.id)}
                  onCheckedChange={() => toggleSection(section.id)}
                />
                <Label htmlFor={section.id}>{section.label}</Label>
              </div>
            ))}
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="summary-text">Summary Text</Label>
            <Textarea
              id="summary-text"
              placeholder="Enter custom executive summary..."
              value={customSummary}
              onChange={(e) => setCustomSummary(e.target.value)}
              className="resize-none h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
