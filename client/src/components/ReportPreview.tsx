import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { ReportGenerator } from '@/services/ReportGenerator';

export const ReportPreview: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [htmlContent, setHtmlContent] = useState<string>('');

    useEffect(() => {
        if (open) {
            loadPreview();
        }
    }, [open]);

    const loadPreview = async () => {
        setLoading(true);
        try {
            const generator = new ReportGenerator();
            // TODO: In a real app, we might want to capture the timeline snapshot here
            const data = await generator.generateReportData();
            // Basic HTML preview without full styles injection if scoped
            // For preview, we might just want to render the raw HTML into an iframe or sanitize it
            const html = generator.generateHtml(data);
            setHtmlContent(html);
        } catch (error) {
            console.error('Failed to load report preview', error);
            setHtmlContent('<p>Error loading preview.</p>');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Preview Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Forensic Report Preview</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="flex justify-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="border p-1 rounded-md bg-white h-[600px]">
                        <iframe
                            title="Report Preview"
                            srcDoc={htmlContent}
                            className="w-full h-full border-none"
                            sandbox="allow-same-origin"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
