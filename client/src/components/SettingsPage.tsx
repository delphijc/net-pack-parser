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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { localStorageService } from '@/services/localStorage';
import { exportDataAsJson, importDataFromJson } from '@/utils/dataImportExport';
import { useToast } from '@/components/ui/use-toast';
import database from '@/services/database';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import { usePerformanceStore } from '@/store/performanceStore';

type ImportMode = 'merge' | 'replace';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [usage, setUsage] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPerformanceConfirm, setShowPerformanceConfirm] = useState(false);
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

  const handleClearAnalysisData = async () => {
    try {
      setIsClearing(true);
      await Promise.all([database.clearAllData(), chainOfCustodyDb.clearAll()]);

      // Update usage stats
      setUsage(localStorageService.getUsagePercentage());
      setShowClearConfirm(false);
      toast({
        title: 'Success',
        description:
          'Analysis data (Packets, Files, Logs) cleared successfully.',
      });
    } catch (error: any) {
      console.error('Failed to clear data:', error);
      toast({
        title: 'Error',
        description: `Failed to clear analysis data: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearPerformanceData = async () => {
    try {
      usePerformanceStore.getState().resetMetrics();
      database.clearPerformanceEntries();
      toast({ title: 'Success', description: 'Performance metrics reset.' });
      setUsage(localStorageService.getUsagePercentage());
      setShowPerformanceConfirm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to clear performance data: ${error.message}`,
        variant: 'destructive',
      });
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

          {/* Clear Analysis Data Dialog */}
          <AlertDialog
            open={showClearConfirm}
            onOpenChange={setShowClearConfirm}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear Analysis Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Analysis Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all parsed PACKETS, imported
                  FILES, and forensic CASES. Settings and Performance metrics
                  will be kept.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isClearing}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleClearAnalysisData();
                  }}
                  disabled={isClearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isClearing ? 'Clearing...' : 'Clear Data'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Clear Performance Data Dialog */}
          <AlertDialog
            open={showPerformanceConfirm}
            onOpenChange={setShowPerformanceConfirm}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                Clear Performance
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Performance Metrics?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all Web Vitals, Long Tasks, and Navigation
                  Timing history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleClearPerformanceData();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear Metrics
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Analysis Preferences Section */}
      <div className="mt-8 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Analysis Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize your default views and analysis behavior.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Default Packet View</label>
          <Select
            value={
              localStorageService.getValue<string>('preferences.defaultView') ||
              'all'
            }
            onValueChange={(value) => {
              localStorageService.setValue('preferences.defaultView', value);
              toast({
                title: 'Preference Saved',
                description: `Default view set to: ${value === 'threats' ? 'Threats Only' : 'All Packets'}`,
              });
              // Force re-render to update UI if needed (though localStorageService doesn't trigger one, the next reload will pick it up)
            }}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select default view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show All Packets</SelectItem>
              <SelectItem value="threats">Show Threats Only</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose what to see first when opening a PCAP file.
          </p>
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
