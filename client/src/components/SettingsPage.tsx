// src/components/SettingsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { localStorageService } from '@/services/localStorage';
import { exportDataAsJson, importDataFromJson } from '@/utils/dataImportExport';
// We will need a toast component for notifications. Let's assume we have one.
import { useToast } from '@/components/ui/use-toast';
import database from '@/services/database';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';

type ImportMode = 'merge' | 'replace';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [usage, setUsage] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [importedFileContent, setImportedFileContent] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsage(localStorageService.getUsagePercentage());

    const unsubscribe = localStorageService.onQuotaExceeded((currentUsage) => {
      toast({
        title: 'Storage Warning',
        description: `Storage approaching limit (${Math.round(currentUsage)}% used)`,
        variant: 'destructive',
      });
      setUsage(currentUsage);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      await database.clearAllData();
      await chainOfCustodyDb.clearAll();
      localStorageService.clearAll();

      setUsage(0);
      setShowClearConfirm(false);
      toast({
        title: 'Success',
        description:
          'All local data (packets, files, logs, settings) cleared successfully.',
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear all data. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = () => {
    try {
      exportDataAsJson();
      toast({
        title: 'Export Started',
        description:
          'Your data export has started and will be downloaded shortly.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description:
          'Could not export your data. Check the console for details.',
        variant: 'destructive',
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportedFileContent(content);
      setShowImportConfirm(true);
    };
    reader.onerror = () => {
      toast({
        title: 'Error Reading File',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
    };
    reader.readAsText(file);

    // Reset file input to allow re-uploading the same file
    event.target.value = '';
  };

  const processImport = (mode: ImportMode) => {
    if (!importedFileContent) return;

    const result = importDataFromJson(importedFileContent, mode);
    if (result.success) {
      toast({
        title: 'Import Successful',
        description: result.message,
      });
      // Refresh usage stats
      setUsage(localStorageService.getUsagePercentage());
    } else {
      toast({
        title: 'Import Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
    setShowImportConfirm(false);
    setImportedFileContent(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Local Storage</h3>
          <p className="text-sm text-muted-foreground">
            Manage your locally stored application data.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="storage-usage">Storage Usage</label>
          <Progress value={usage} id="storage-usage" />
          <p className="text-sm text-muted-foreground">
            {usage.toFixed(2)}% used
          </p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleImportClick}>Import Data</Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <Button onClick={handleExportData}>Export Data</Button>
          <AlertDialog
            open={showClearConfirm}
            onOpenChange={setShowClearConfirm}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear All Local Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  your analysis data, settings, and other cached information
                  from your browser.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isClearing}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleClearData();
                  }}
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Continue'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose Import Mode</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to merge the imported data with your existing data,
              or replace everything with the new data?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportedFileContent(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => processImport('merge')}>
              Merge
            </AlertDialogAction>
            <AlertDialogAction onClick={() => processImport('replace')}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
