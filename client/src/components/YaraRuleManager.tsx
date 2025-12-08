// client/src/components/YaraRuleManager.tsx

import React, { useEffect, useState } from 'react';
import { useYaraRuleStore } from '@/store/yaraRuleStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash2, Upload, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const YaraRuleManager: React.FC = () => {
  const {
    rules,
    loadRules,
    addRule,
    toggleRule,
    deleteRule,
    isLoading,
    error,
  } = useYaraRuleStore();
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleAddRule = async () => {
    if (newRuleName && newRuleContent) {
      await addRule(newRuleName, newRuleContent);
      setNewRuleName('');
      setNewRuleContent('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        await addRule(file.name, content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>YARA Rule Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Rule Name"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
              />
              <Textarea
                placeholder="Paste YARA rule content here..."
                value={newRuleContent}
                onChange={(e) => setNewRuleContent(e.target.value)}
                className="font-mono text-xs h-32"
              />
              <Button
                onClick={handleAddRule}
                disabled={!newRuleName || !newRuleContent}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Rule
              </Button>
            </div>
            <div className="flex items-start">
              <div className="relative">
                <input
                  type="file"
                  accept=".yar,.yara"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" /> Upload .yar File
                </Button>
              </div>
            </div>
          </div>

          {isLoading && <p>Loading rules...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 border rounded-md bg-card"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                      {rule.content.substring(0, 50)}...
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRuleToDelete(rule.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {rules.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-4">
                No YARA rules loaded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete YARA Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this threat detection rule? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (ruleToDelete) {
                  deleteRule(ruleToDelete);
                  setRuleToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};

export default YaraRuleManager;
