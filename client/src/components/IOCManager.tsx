import React, { useState, useEffect } from 'react';
import { iocService, type IOC } from '../services/iocService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Upload, Download, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const IOCManager: React.FC = () => {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newIOC, setNewIOC] = useState<Partial<IOC>>({
    type: 'ip',
    severity: 'high',
    enabled: true,
  });

  const loadIOCs = async () => {
    const data = await iocService.getAllIOCs();
    setIocs(data);
  };

  useEffect(() => {
    loadIOCs();
  }, []);

  const handleAddIOC = async () => {
    if (!newIOC.value) return;

    const ioc: IOC = {
      id: uuidv4(),
      type: newIOC.type as IOC['type'],
      value: newIOC.value,
      description: newIOC.description || '',
      source: newIOC.source || 'Manual',
      severity: newIOC.severity as IOC['severity'],
      enabled: true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      mitreAttack: [],
    };

    await iocService.addIOC(ioc);
    setNewIOC({
      type: 'ip',
      severity: 'high',
      enabled: true,
      value: '',
      description: '',
    });
    loadIOCs();
  };

  const handleDeleteIOC = async (id: string) => {
    await iocService.removeIOC(id);
    loadIOCs();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);
        if (Array.isArray(imported)) {
          await iocService.importIOCs(imported);
          loadIOCs();
          alert(`Imported ${imported.length} IOCs`);
        }
      } catch (error) {
        console.error('Import failed', error);
        alert('Import failed: Invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    const json = await iocService.exportIOCs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ioc-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredIOCs = iocs.filter((ioc) => {
    const matchesType = filterType === 'all' || ioc.type === filterType;
    const matchesSearch =
      ioc.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ioc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">IOC Manager</h2>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              id="import-ioc"
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-ioc')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="ghost" onClick={loadIOCs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add New IOC Form */}
      <div className="bg-card p-4 rounded-lg border flex gap-4 items-end">
        <div className="grid gap-2 w-32">
          <label className="text-sm font-medium">Type</label>
          <Select
            value={newIOC.type}
            onValueChange={(v) =>
              setNewIOC({ ...newIOC, type: v as IOC['type'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ip">IP</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
              <SelectItem value="hash">Hash</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 flex-1">
          <label className="text-sm font-medium">Value</label>
          <Input
            placeholder="1.2.3.4 or malicious.com"
            value={newIOC.value || ''}
            onChange={(e) => setNewIOC({ ...newIOC, value: e.target.value })}
          />
        </div>

        <div className="grid gap-2 flex-1">
          <label className="text-sm font-medium">Description</label>
          <Input
            placeholder="Botnet C2..."
            value={newIOC.description || ''}
            onChange={(e) =>
              setNewIOC({ ...newIOC, description: e.target.value })
            }
          />
        </div>

        <div className="grid gap-2 w-32">
          <label className="text-sm font-medium">Severity</label>
          <Select
            value={newIOC.severity}
            onValueChange={(v) =>
              setNewIOC({ ...newIOC, severity: v as IOC['severity'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAddIOC}>
          <Plus className="mr-2 h-4 w-4" /> Add IOC
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ip">IP</SelectItem>
            <SelectItem value="domain">Domain</SelectItem>
            <SelectItem value="hash">Hash</SelectItem>
            <SelectItem value="url">URL</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search IOCs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* List */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIOCs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No IOCs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredIOCs.map((ioc) => (
                <TableRow key={ioc.id}>
                  <TableCell className="font-medium uppercase">
                    {ioc.type}
                  </TableCell>
                  <TableCell className="font-mono">{ioc.value}</TableCell>
                  <TableCell>{ioc.description}</TableCell>
                  <TableCell>{ioc.source}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ioc.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : ioc.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : ioc.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ioc.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteIOC(ioc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
