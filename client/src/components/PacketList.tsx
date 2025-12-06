import React, { useState, useEffect, useMemo } from 'react';
import type { ParsedPacket } from '../types'; // Updated import path
import {
  multiCriteriaSearch,
  type MultiSearchCriteria,
} from '@/utils/multiCriteriaSearch'; // Import multiCriteriaSearch and MultiSearchCriteria
import {
  Search,
  Trash2,
  Clock,
  Shield,
  X,
  Activity,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlowList } from './FlowList';
import { aggregateFlows } from '@/utils/flowUtils';
import { localStorageService } from '@/services/localStorage';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import database from '../services/database';

interface PacketListProps {
  onPacketSelect: (packet: ParsedPacket | null) => void;
  selectedPacketId: string | null;
  packets: ParsedPacket[]; // Packets now received as a prop
  onClearAllPackets: () => void; // Callback to clear all packets in parent
  selectedProtocol?: string;
  onPacketDeleted?: () => void; // Optional callback when a packet is deleted
  searchCriteria?: MultiSearchCriteria | null; // Add searchCriteria prop
  onClearSearchCriteria?: () => void; // Add callback to clear search criteria
}

const PacketList: React.FC<PacketListProps> = ({
  onPacketSelect,
  selectedPacketId,
  packets,
  onClearAllPackets,
  selectedProtocol,
  onPacketDeleted,
  searchCriteria,
  onClearSearchCriteria,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [packetToDelete, setPacketToDelete] = useState<string | null>(null);

  // New State for Smart Views
  const [viewMode, setViewMode] = useState<'packets' | 'flows'>('packets');
  // Initialize preferences lazily
  const [showThreatsOnly, setShowThreatsOnly] = useState(() => {
    return (
      localStorageService.getValue<string>('preferences.defaultView') ===
      'threats'
    );
  });
  const { toast } = useToast();

  // Compute Flows
  const flows = useMemo(() => {
    if (viewMode === 'flows') {
      // In a real large app, this should be in a worker.
      return aggregateFlows(packets);
    }
    return [];
  }, [packets, viewMode]);

  // Large file warning
  useEffect(() => {
    // Determine if large file suggestion needed
    if (
      packets.length > 10000 &&
      viewMode === 'packets' &&
      !localStorageService.getValue<boolean>(
        'preferences.suppressLargeFileWarning',
      )
    ) {
      toast({
        title: 'Large File Detected',
        description: 'For better performance, consider switching to Flow View.',
        action: (
          <div
            onClick={() => setViewMode('flows')}
            className="font-bold cursor-pointer hover:underline"
          >
            Switch to Flows
          </div>
        ),
      });
      // Avoid spamming
      localStorageService.setValue(
        'preferences.suppressLargeFileWarning',
        true,
      );
    }
  }, [packets.length, viewMode, toast]);

  const filteredPackets = useMemo(() => {
    let result = packets.map((p) => ({ ...p, matchesSearch: false })); // Initialize matchesSearch

    // Apply search (existing text search)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.sourceIP.toLowerCase().includes(lowerTerm) ||
          p.destIP.toLowerCase().includes(lowerTerm) ||
          p.protocol.toLowerCase().includes(lowerTerm) ||
          p.detectedProtocols?.some((dp: string) =>
            dp.toLowerCase().includes(lowerTerm),
          ) ||
          (p.rawData &&
            new TextDecoder()
              .decode(new Uint8Array(p.rawData))
              .toLowerCase()
              .includes(lowerTerm)),
      );
    }

    // Apply protocol filter
    if (selectedProtocol && selectedProtocol !== 'ALL') {
      result = result.filter((p) =>
        p.detectedProtocols?.includes(selectedProtocol),
      );
    }

    // Apply "Show Threats Only" filter
    if (showThreatsOnly) {
      result = result.filter(
        (p) =>
          (p.suspiciousIndicators && p.suspiciousIndicators.length > 0) ||
          (p.threatIntelligence && p.threatIntelligence.length > 0),
      );
    }

    // Apply multi-criteria search for highlighting
    if (searchCriteria) {
      result = result.map((p) => ({
        ...p,
        matchesSearch: multiCriteriaSearch(p, searchCriteria),
      }));
    }

    // Apply sort
    result.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [
    packets,
    searchTerm,
    selectedProtocol,
    searchCriteria,
    sortOrder,
    showThreatsOnly,
  ]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPacketToDelete(id);
  };

  const confirmDelete = async () => {
    if (packetToDelete) {
      await database.deletePacket(packetToDelete);
      onPacketSelect(null); // Clear selected packet in parent
      onPacketDeleted?.(); // Notify parent that a packet was deleted
      setPacketToDelete(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all packets?')) {
      onClearAllPackets(); // Call parent's clear function
      onPacketSelect(null);
    }
  };

  // Format search criteria for display
  const formatSearchCriteria = (criteria: MultiSearchCriteria): string => {
    const parts: string[] = [];
    if (criteria.sourceIp?.ip) parts.push(`Source IP: ${criteria.sourceIp.ip}`);
    if (criteria.destIp?.ip) parts.push(`Dest IP: ${criteria.destIp.ip}`);
    if (criteria.sourcePort) {
      const port =
        typeof criteria.sourcePort.port === 'number'
          ? criteria.sourcePort.port
          : `${criteria.sourcePort.port?.start}-${criteria.sourcePort.port?.end}`;
      parts.push(`Source Port: ${port}`);
    }
    if (criteria.destPort) {
      const port =
        typeof criteria.destPort.port === 'number'
          ? criteria.destPort.port
          : `${criteria.destPort.port?.start}-${criteria.destPort.port?.end}`;
      parts.push(`Dest Port: ${port}`);
    }
    if (criteria.protocol?.protocol)
      parts.push(`Protocol: ${criteria.protocol.protocol}`);
    if (criteria.payload?.content)
      parts.push(`Payload: "${criteria.payload.content}"`);
    if (criteria.timeRange) {
      parts.push(
        `Time: ${new Date(criteria.timeRange.start).toLocaleString()} - ${new Date(criteria.timeRange.end).toLocaleString()}`,
      );
    }
    return parts.join(' | ') + ` (${criteria.logic})`;
  };

  return (
    <div className="bg-card border border-white/10 rounded-lg shadow-sm flex flex-col overflow-hidden backdrop-blur-sm h-full">
      <div className="p-3 border-b border-white/10 bg-card/50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold flex items-center text-foreground">
            {viewMode === 'packets' ? 'Captured Packets' : 'Network Flows'}
            <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
              {viewMode === 'packets' ? filteredPackets.length : flows.length}
            </span>
          </h2>
          <button
            onClick={handleClearAll}
            className="text-xs text-destructive hover:text-destructive/80 flex items-center transition-colors"
            title="Clear all packets"
          >
            <Trash2 size={14} className="mr-1" />
            Clear
          </button>
        </div>

        {searchCriteria && (
          <div className="mb-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-300 text-black hover:bg-yellow-400 cursor-help flex items-center gap-1 max-w-full"
                  >
                    <Search size={12} />
                    <span className="truncate">Current Search</span>
                    {onClearSearchCriteria && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearSearchCriteria();
                        }}
                        className="ml-1 hover:bg-yellow-500 rounded-full p-0.5"
                        title="Clear search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-xs font-semibold mb-1">Search Criteria:</p>
                  <p className="text-xs">
                    {formatSearchCriteria(searchCriteria)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div className="flex space-x-2 mb-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search packets..."
              className="w-full bg-secondary border border-white/10 rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-muted-foreground transition-colors"
            title={sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
          >
            <Clock size={16} />
          </button>
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-2 mb-2 p-1 bg-secondary/20 rounded-md">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as 'packets' | 'flows')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-7">
              <TabsTrigger value="packets" className="text-xs h-6">
                <Activity size={12} className="mr-1" />
                Packets
              </TabsTrigger>
              <TabsTrigger value="flows" className="text-xs h-6">
                <Layers size={12} className="mr-1" />
                Flows
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center mb-2 px-1">
          <Button
            size="sm"
            variant={showThreatsOnly ? 'destructive' : 'outline'}
            onClick={() => setShowThreatsOnly(!showThreatsOnly)}
            aria-label="Toggle threats only"
            className={`w-full text-xs h-7 border-transparent ${showThreatsOnly ? 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30' : 'hover:bg-secondary'}`}
          >
            <Shield size={12} className="mr-2" />
            {showThreatsOnly ? 'Threats Only' : 'Show Threats Only'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {viewMode === 'flows' ? (
          <FlowList flows={flows} onPacketSelect={onPacketSelect} />
        ) : filteredPackets.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-sm">No packets found</p>
            {searchTerm && (
              <p className="text-xs mt-1 opacity-70">
                Try adjusting your filters
              </p>
            )}
          </div>
        ) : (
          filteredPackets.map((packet) => (
            <div
              key={packet.id}
              data-testid={`packet-item-${packet.id}`}
              onClick={() => onPacketSelect(packet)}
              className={`group p-2 rounded-md cursor-pointer border transition-all duration-200 ${
                selectedPacketId === packet.id
                  ? 'bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(124,58,237,0.1)]'
                  : 'bg-card/30 border-transparent hover:bg-secondary/50 hover:border-white/5'
              } ${packet.matchesSearch ? 'bg-yellow-200/20 border-yellow-300' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  {packet.detectedProtocols?.map((proto: string) => (
                    <Badge
                      key={proto}
                      variant="outline"
                      className={`text-[10px] font-bold px-1.5 py-0.5 ${
                        proto === 'HTTP' || proto === 'HTTPS'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : proto === 'TCP'
                            ? 'bg-blue-500/10 text-blue-500'
                            : proto === 'UDP'
                              ? 'bg-orange-500/10 text-orange-500'
                              : proto === 'DNS'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {proto}
                    </Badge>
                  ))}
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(packet.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {packet.suspiciousIndicators &&
                  packet.suspiciousIndicators.length > 0 && (
                    <Shield size={12} className="text-destructive" />
                  )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center text-xs font-mono text-foreground/80 truncate max-w-[180px]">
                  <span className="truncate">
                    {packet.sourceIP} → {packet.destIP}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteClick(packet.id, e)}
                  className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete packet"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <AlertDialog
        open={!!packetToDelete}
        onOpenChange={(open) => !open && setPacketToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Packet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this packet? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PacketList;
