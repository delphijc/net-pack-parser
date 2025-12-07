import React, { useState } from 'react';
import { Package, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { evidencePackager } from '@/services/EvidencePackager';
import { useAuditLogger } from '@/hooks/useAuditLogger';

interface ExportControlProps {
  pcapFile: File | null;
  disabled?: boolean;
}

export const ExportControl: React.FC<ExportControlProps> = ({
  pcapFile,
  disabled,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const { logAction } = useAuditLogger();

  const handleExport = async () => {
    if (!pcapFile) return;

    try {
      setIsExporting(true);
      setLastHash(null);

      // We pass the file blob and name
      const hash = await evidencePackager.exportPackage(
        pcapFile,
        pcapFile.name,
      );
      setLastHash(hash);

      logAction('EXPORT', `Exported Evidence Package for ${pcapFile.name}`, {
        packageHash: hash,
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={disabled || !pcapFile || isExporting}
        className="bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400"
      >
        {isExporting ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Packaging...
          </>
        ) : (
          <>
            <Package size={16} className="mr-2" />
            Export Evidence
          </>
        )}
      </Button>

      {lastHash && (
        <div className="flex items-center gap-2 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded border border-slate-700 font-mono animate-fadeIn">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-slate-500">SHA-256:</span>
          <span title={lastHash}>{lastHash.substring(0, 16)}...</span>
        </div>
      )}
    </div>
  );
};
