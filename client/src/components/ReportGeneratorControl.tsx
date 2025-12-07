import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer } from 'lucide-react';
import { ReportGenerator } from '@/services/ReportGenerator';
import type { ReportData } from '@/services/ReportGenerator';
import { ReportPreview } from './ReportPreview';

interface ReportGeneratorControlProps {
    disabled?: boolean;
}

export const ReportGeneratorControl: React.FC<ReportGeneratorControlProps> = ({ disabled }) => {
    const [generating, setGenerating] = useState(false);

    const handleGeneratePdf = async () => {
        setGenerating(true);
        try {
            const generator = new ReportGenerator();
            // TODO: Capture timeline snapshot if needed
            const data: ReportData = await generator.generateReportData();
            await generator.generatePdf(data);
        } catch (error) {
            console.error('Failed to generate PDF report', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateHtml = async () => {
        setGenerating(true);
        try {
            const generator = new ReportGenerator();
            const data: ReportData = await generator.generateReportData();
            const html = generator.generateHtml(data);

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report - ${data.metadata.caseId}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to generate HTML report', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex gap-2 items-center">
            <ReportPreview />
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePdf}
                disabled={disabled || generating}
            >
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
                Export PDF
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateHtml}
                disabled={disabled || generating}
            >
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Export HTML
            </Button>
        </div>
    );
};
