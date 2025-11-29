// client/src/components/AdvancedSearchPanel.tsx
import React, { useState, useEffect } from 'react';
import type { MultiSearchCriteria, LogicalOperator } from '@/utils/multiCriteriaSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { savedSearchService, type SavedSearch } from '@/services/savedSearchService';

interface AdvancedSearchPanelProps {
  onSearch: (criteria: MultiSearchCriteria) => void;
  onClear: () => void;
}

const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({ onSearch, onClear }) => {
  const [sourceIp, setSourceIp] = useState('');
  const [destIp, setDestIp] = useState('');
  const [sourcePort, setSourcePort] = useState('');
  const [destPort, setDestPort] = useState('');
  const [protocol, setProtocol] = useState('ANY');
  const [timeRangeStart, setTimeRangeStart] = useState('');
  const [timeRangeEnd, setTimeRangeEnd] = useState('');
  const [payloadContent, setPayloadContent] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [logic, setLogic] = useState<LogicalOperator>('AND');

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [newSearchName, setNewSearchName] = useState('');
  const [searchToDelete, setSearchToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const setFormCriteria = (criteria: MultiSearchCriteria) => {
    setSourceIp(criteria.sourceIp?.ip || '');
    setDestIp(criteria.destIp?.ip || '');
    setSourcePort(
      criteria.sourcePort?.port
        ? typeof criteria.sourcePort.port === 'number'
          ? String(criteria.sourcePort.port)
          : `${criteria.sourcePort.port.start}-${criteria.sourcePort.port.end}`
        : ''
    );
    setDestPort(
      criteria.destPort?.port
        ? typeof criteria.destPort.port === 'number'
          ? String(criteria.destPort.port)
          : `${criteria.destPort.port.start}-${criteria.destPort.port.end}`
        : ''
    );
    setProtocol(criteria.protocol?.protocol || 'ANY');
    setTimeRangeStart(
      criteria.timeRange?.start ? new Date(criteria.timeRange.start).toISOString().slice(0, 16) : ''
    );
    setTimeRangeEnd(
      criteria.timeRange?.end ? new Date(criteria.timeRange.end).toISOString().slice(0, 16) : ''
    );
    setPayloadContent(criteria.payload?.content || '');
    setCaseSensitive(criteria.payload?.caseSensitive || false);
    setLogic(criteria.logic || 'AND');
  };

  const loadSavedSearches = () => {
    setSavedSearches(savedSearchService.getAllSavedSearches());
  };

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const handleSaveSearchClick = () => {
    const currentCriteria = buildCriteria();
    if (Object.keys(currentCriteria).length <= 1) { // Only logic exists
      toast({
        title: "Empty Search",
        description: "Please enter some search criteria before saving.",
        variant: "destructive",
      });
      return false;
    }
    setNewSearchName(''); // Clear previous name
    return true; // Allow AlertDialog to open
  };

  const handleSaveSearch = () => {
    if (!newSearchName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Search name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    const success = savedSearchService.saveSearch(newSearchName, buildCriteria());
    if (success) {
      loadSavedSearches();
      toast({
        title: "Search Saved",
        description: `Search "${newSearchName}" saved successfully.`,
      });
    } else {
      toast({
        title: "Save Failed",
        description: `Failed to save search "${newSearchName}".`,
        variant: "destructive",
      });
    }
  };

  const handleLoadSavedSearch = (name: string) => {
    const criteria = savedSearchService.loadSearch(name);
    if (criteria) {
      setFormCriteria(criteria);
      toast({
        title: "Search Loaded",
        description: `Loaded search "${name}".`,
      });
    } else {
      toast({
        title: "Load Failed",
        description: `Could not load search "${name}".`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (name: string) => {
    setSearchToDelete(name);
  };

  const confirmDelete = () => {
    if (searchToDelete) {
      savedSearchService.deleteSearch(searchToDelete);
      loadSavedSearches();
      toast({
        title: "Search Deleted",
        description: `Search "${searchToDelete}" deleted.`,
      });
      setSearchToDelete(null);
    }
  };

  const buildCriteria = (): MultiSearchCriteria => {
    const criteria: MultiSearchCriteria = {
      logic: logic,
    };

    if (sourceIp) {
      const isCidr = sourceIp.includes('/');
      criteria.sourceIp = { ip: sourceIp, isCidr };
    }
    if (destIp) {
      const isCidr = destIp.includes('/');
      criteria.destIp = { ip: destIp, isCidr };
    }
    if (sourcePort) {
      const portNum = parseInt(sourcePort, 10);
      if (!isNaN(portNum)) {
        criteria.sourcePort = { port: portNum };
      } else if (sourcePort.includes('-')) {
        const [start, end] = sourcePort.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) criteria.sourcePort = { port: { start, end } };
      }
    }
    if (destPort) {
      const portNum = parseInt(destPort, 10);
      if (!isNaN(portNum)) {
        criteria.destPort = { port: portNum };
      } else if (destPort.includes('-')) {
        const [start, end] = destPort.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) criteria.destPort = { port: { start, end } };
      }
    }
    if (protocol && protocol !== 'ANY') {
      criteria.protocol = { protocol };
    }
    if (timeRangeStart || timeRangeEnd) {
      const startTimestamp = timeRangeStart ? new Date(timeRangeStart).getTime() : 0;
      const endTimestamp = timeRangeEnd ? new Date(timeRangeEnd).getTime() : Date.now();
      criteria.timeRange = { start: startTimestamp, end: endTimestamp };
    }
    if (payloadContent) {
      criteria.payload = { content: payloadContent, caseSensitive };
    }
    return criteria;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(buildCriteria());
  };

  const handleClearAll = () => {
    setFormCriteria({ logic: 'AND' }); // Clear all fields
    onClear();
  };

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          {/* Source IP */}
          <div>
            <Label htmlFor="source-ip">Source IP</Label>
            <Input id="source-ip" value={sourceIp} onChange={(e) => setSourceIp(e.target.value)} placeholder="e.g., 192.168.1.1 or 192.168.1.0/24" />
          </div>
          {/* Destination IP */}
          <div>
            <Label htmlFor="dest-ip">Destination IP</Label>
            <Input id="dest-ip" value={destIp} onChange={(e) => setDestIp(e.target.value)} placeholder="e.g., 8.8.8.8" />
          </div>
          {/* Source Port */}
          <div>
            <Label htmlFor="source-port">Source Port</Label>
            <Input id="source-port" value={sourcePort} onChange={(e) => setSourcePort(e.target.value)} placeholder="e.g., 80 or 1024-5000" />
          </div>
          {/* Destination Port */}
          <div>
            <Label htmlFor="dest-port">Destination Port</Label>
            <Input id="dest-port" value={destPort} onChange={(e) => setDestPort(e.target.value)} placeholder="e.g., 443" />
          </div>
          {/* Protocol */}
          <div>
            <Label htmlFor="protocol">Protocol</Label>
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger id="protocol">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any</SelectItem>
                <SelectItem value="TCP">TCP</SelectItem>
                <SelectItem value="UDP">UDP</SelectItem>
                <SelectItem value="ICMP">ICMP</SelectItem>
                <SelectItem value="HTTP">HTTP</SelectItem>
                <SelectItem value="HTTPS">HTTPS</SelectItem>
                <SelectItem value="DNS">DNS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Time Range - Start */}
          <div>
            <Label htmlFor="time-range-start">Time Range (Start)</Label>
            <Input type="datetime-local" id="time-range-start" value={timeRangeStart} onChange={(e) => setTimeRangeStart(e.target.value)} />
          </div>
          {/* Time Range - End */}
          <div>
            <Label htmlFor="time-range-end">Time Range (End)</Label>
            <Input type="datetime-local" id="time-range-end" value={timeRangeEnd} onChange={(e) => setTimeRangeEnd(e.target.value)} />
          </div>
          {/* Payload Contains */}
          <div>
            <Label htmlFor="payload-contains">Payload Contains</Label>
            <Input id="payload-contains" value={payloadContent} onChange={(e) => setPayloadContent(e.target.value)} placeholder="e.g., password" />
            <div className="flex items-center mt-2">
              <Checkbox id="case-sensitive" checked={caseSensitive} onCheckedChange={(checked) => setCaseSensitive(!!checked)} />
              <Label htmlFor="case-sensitive" className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Case sensitive</Label>
            </div>
          </div>
        </div>

        {/* AND/OR logic */}
        <div className="mt-6">
          <Label>Combine Criteria With:</Label>
          <RadioGroup value={logic} onValueChange={(value: LogicalOperator) => setLogic(value)} className="mt-2 flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AND" id="logic-and" />
              <Label htmlFor="logic-and">AND</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OR" id="logic-or" />
              <Label htmlFor="logic-or">OR</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleClearAll}>Clear All</Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" onClick={handleSaveSearchClick}>Save Search</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save Current Search</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter a name for your search criteria.
                  <Input
                    id="new-search-name"
                    value={newSearchName}
                    onChange={(e) => setNewSearchName(e.target.value)}
                    placeholder="Search Name"
                    className="mt-2"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveSearch}>Save</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={savedSearches.length === 0}>
                Load Saved <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedSearches.map((search) => (
                <DropdownMenuItem key={search.name} className="flex justify-between items-center">
                  <span onClick={() => handleLoadSavedSearch(search.name)} className="flex-grow cursor-pointer">
                    {search.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(search.name);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="submit">Search</Button>

          <AlertDialog open={!!searchToDelete} onOpenChange={(open) => !open && setSearchToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Saved Search</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{searchToDelete}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  );
};

export default AdvancedSearchPanel;