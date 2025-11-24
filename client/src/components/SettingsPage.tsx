// src/components/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
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
// We will need a toast component for notifications. Let's assume we have one.
import { useToast } from "@/components/ui/use-toast"

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [usage, setUsage] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setUsage(localStorageService.getUsagePercentage());

    const unsubscribe = localStorageService.onQuotaExceeded(currentUsage => {
      toast({
        title: 'Storage Warning',
        description: `Storage approaching limit (${Math.round(currentUsage)}% used)`,
        variant: 'destructive',
      });
      setUsage(currentUsage);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleClearData = () => {
    localStorageService.clearAll();
    setUsage(0);
    setShowClearConfirm(false);
    toast({
      title: 'Success',
      description: 'All local data cleared successfully.',
    });
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
          <p className="text-sm text-muted-foreground">{usage.toFixed(2)}% used</p>
        </div>

        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Clear All Local Data</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your
                analysis data, settings, and other cached information from your browser.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearData}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SettingsPage;
