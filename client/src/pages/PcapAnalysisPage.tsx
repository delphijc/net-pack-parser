import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ParsedPacket } from '@/types';
import PacketList from '@/components/PacketList';
import PacketDetailView from '@/components/PacketDetailView';
import { ProtocolFilter } from '@/components/ProtocolFilter';
import { ProtocolDistribution } from '@/components/dashboard/ProtocolDistribution';
import { api } from '@/services/api'; // Added api import
import { useSessionStore } from '@/store/sessionStore'; // Ensure this is imported
// import database from '@/services/database'; // Removed database import
import { FilterBar } from '@/components/FilterBar';
import { matchBpfFilter, validateBpfFilter } from '@/utils/bpfFilter';
import type { BpfAST } from '@/utils/bpfFilter';
import AdvancedSearchPanel from '@/components/AdvancedSearchPanel';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';
import {
  multiCriteriaSearch,
  type MultiSearchCriteria,
} from '@/utils/multiCriteriaSearch';
import { cn } from '@/lib/utils';
import type { ThreatAlert } from '@/types/threat'; // Import ThreatAlert type


import { useTimelineStore } from '@/store/timelineStore';
import { useDebounce } from '@/hooks/useDebounce';

import { useToast } from '@/components/ui/use-toast'; // Added useToast import

interface PcapAnalysisPageProps {
  initialFilter?: string;
}

const PcapAnalysisPage: React.FC<PcapAnalysisPageProps> = ({
  initialFilter,
}) => {
  const { toast } = useToast(); // Initialized useToast
  const [allPackets, setAllPackets] = useState<ParsedPacket[]>([]);
  const { startTime, endTime } = useTimelineStore();
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  // Debounce timeline filter to prevent UI lag during dragging (300ms)
  const debouncedStartTime = useDebounce(startTime, 300);
  const debouncedEndTime = useDebounce(endTime, 300);

  const [selectedPacket, setSelectedPacket] = useState<ParsedPacket | null>(
    null,
  );
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | undefined>(
    undefined,
  );
  const [availableProtocols, setAvailableProtocols] = useState<string[]>([]);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [multiSearchCriteria, setMultiSearchCriteria] =
    useState<MultiSearchCriteria | null>(null);

  const [allThreats, setAllThreats] = useState<ThreatAlert[]>([]);

  const [bpfFilterAst, setBpfFilterAst] = useState<BpfAST | null>(() => {
    if (!initialFilter) return null;
    const res = validateBpfFilter(initialFilter);
    return res.isValid && res.ast ? res.ast : null;
  });
  const [bpfFilterError, setBpfFilterError] = useState<string | undefined>(
    () => {
      if (!initialFilter) return undefined;
      const res = validateBpfFilter(initialFilter);
      return res.isValid ? undefined : res.error;
    },
  );

  // Polling for packets from the database
  useEffect(() => {
    const activeSessionId = useSessionStore.getState().activeSessionId;

    const loadPackets = async () => {
      if (!activeSessionId) {
        setAllPackets([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch packets from server API
        const results = await api.getResults(activeSessionId, 0, 10000); // Fetch up to 10k packets for now

        if (results.packets) {
          setAllPackets(results.packets);

          // Collect threats for state if needed
          const detectedThreats = results.packets.flatMap((p: any) => p.threats || []);
          setAllThreats(detectedThreats as ThreatAlert[]);

          // Extract unique protocols for the filter
          const uniqueProtocols = Array.from(
            new Set((results.packets as ParsedPacket[]).flatMap((p) => p.detectedProtocols || [])),
          );
          setAvailableProtocols(uniqueProtocols);
        }

      } catch (error: any) {
        console.error('[PcapAnalysisPage] Error loading packets from API:', error);
        toast({
          title: "Error loading packets",
          description: error.message || "Failed to fetch packet data from server.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPackets();

    // Subscribe to session changes
    const unsubscribe = useSessionStore.subscribe((state) => {
      if (state.activeSessionId !== activeSessionId) {
        // Trigger reload if session ID changes
        // (In functional component, simple re-render with new dep works, but we need to ensure this effect runs on ID change)
      }
    });

    return () => unsubscribe();
  }, [toast]); // removed activeSessionId from dep as we read from store directly or via hook re-render? No, better to use hook.


  const displayedPackets = useMemo(() => {
    let filtered = allPackets;

    // Apply timeline filter
    if (debouncedStartTime !== null && debouncedEndTime !== null) {
      filtered = filtered.filter(
        (p) =>
          p.timestamp >= debouncedStartTime && p.timestamp <= debouncedEndTime,
      );
    }

    // Apply protocol filter first
    if (selectedProtocol && selectedProtocol !== 'ALL') {
      filtered = filtered.filter((p) =>
        p.detectedProtocols?.includes(selectedProtocol),
      );
    }

    // Apply BPF filter
    if (bpfFilterAst) {
      filtered = filtered.filter((packet) =>
        matchBpfFilter(packet, bpfFilterAst),
      );
    }

    // Apply multi-criteria search filter
    if (multiSearchCriteria) {
      filtered = filtered.filter((packet) =>
        multiCriteriaSearch(packet, multiSearchCriteria),
      );
    }

    return filtered;
  }, [
    allPackets,
    selectedProtocol,
    bpfFilterAst,
    multiSearchCriteria,
    debouncedStartTime,
    debouncedEndTime,
  ]);

  const handlePacketSelect = (packet: ParsedPacket | null) => {
    setSelectedPacket(packet);
    setIsDetailViewOpen(!!packet);
  };

  const handleDetailViewClose = (open: boolean) => {
    setIsDetailViewOpen(open);
    if (!open) {
      setSelectedPacket(null);
    }
  };

  const handleClearAllPackets = () => {
    // database.clearAllData(); // Removed
    setAllPackets([]);

    setSelectedPacket(null);
    setAvailableProtocols([]);
    setBpfFilterAst(null);
    setBpfFilterError(undefined);
  };

  const handlePacketDeleted = useCallback(async () => {
    // For server-side, we would re-fetch. For now, since delete is client-simulated or pending, 
    // we can just re-fetch from API if we assume server handles delete, OR just do nothing until server delete is ready.
    // Let's just re-fetch current session data to be safe/consistent.
    const activeSessionId = useSessionStore.getState().activeSessionId;
    if (activeSessionId) {
      try {
        const results = await api.getResults(activeSessionId, 0, 10000);
        if (results.packets) {
          setAllPackets(results.packets);

          const detectedThreats = results.packets.flatMap((p: any) => p.threats || []);
          setAllThreats(detectedThreats as ThreatAlert[]);

          const uniqueProtocols = Array.from(
            new Set((results.packets as ParsedPacket[]).flatMap((p) => p.detectedProtocols || [])),
          );
          setAvailableProtocols(uniqueProtocols);
        }
      } catch (e) { console.error("Error refreshing after delete", e); }
    }
  }, []);

  const handleBpfFilterChange = useCallback((filter: string) => {
    if (filter.trim() === '') {
      setBpfFilterAst(null);
      setBpfFilterError(undefined);
      return;
    }

    const validationResult = validateBpfFilter(filter);
    if (validationResult.isValid && validationResult.ast) {
      setBpfFilterAst(validationResult.ast);
      setBpfFilterError(undefined);
    } else {
      setBpfFilterAst(null);
      setBpfFilterError(validationResult.error);
    }
  }, []);

  const handleClearBpfFilter = useCallback(() => {
    setBpfFilterAst(null);
    setBpfFilterError(undefined);
  }, []);

  const handleAdvancedSearch = useCallback((criteria: MultiSearchCriteria) => {
    setMultiSearchCriteria(criteria);
    setIsAdvancedSearchOpen(true); // Keep panel open after search
  }, []);

  const handleClearAdvancedSearch = useCallback(() => {
    setMultiSearchCriteria(null);
  }, []);

  const selectedPacketThreats = useMemo(() => {
    if (!selectedPacket) return [];
    // Prefer threats strictly attached to the packet from backend
    if (selectedPacket.threats) return selectedPacket.threats;
    // Fallback to searching allThreats just in case
    return allThreats.filter((threat) => threat.packetId === selectedPacket.id);
  }, [allThreats, selectedPacket]);

  const selectedPacketId = selectedPacket ? selectedPacket.id : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] p-6">
      <div className="lg:col-span-1 flex flex-col space-y-4">
        <FilterBar
          onFilterChange={handleBpfFilterChange}
          onClearFilter={handleClearBpfFilter}
          errorMessage={bpfFilterError}
          packetCount={displayedPackets.length}
          totalPacketCount={allPackets.length}
        />
        {isLoading && (
          <div className="p-2 text-center text-sm text-muted-foreground animate-pulse">
            Loading packets...
          </div>
        )}
        <ProtocolFilter
          protocols={availableProtocols}
          selectedProtocol={selectedProtocol}
          onProtocolChange={setSelectedProtocol}
        />
        <Collapsible
          open={isAdvancedSearchOpen}
          onOpenChange={setIsAdvancedSearchOpen}
          className="w-full space-y-2"
        >
          <div className="flex items-center justify-between space-x-4 px-4">
            <h4 className="text-sm font-semibold">Advanced Search</h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDownIcon
                  className={cn(
                    'h-4 w-4',
                    isAdvancedSearchOpen ? 'rotate-180' : '',
                  )}
                />
                <span className="sr-only">Toggle Advanced Search</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <AdvancedSearchPanel
              onSearch={handleAdvancedSearch}
              onClear={handleClearAdvancedSearch}
            />
          </CollapsibleContent>{' '}
        </Collapsible>
        <PacketList
          packets={displayedPackets} // Pass filtered packets to PacketList
          allPackets={allPackets} // Pass all packets for export
          onPacketSelect={handlePacketSelect}
          selectedPacketId={selectedPacketId}
          onClearAllPackets={handleClearAllPackets} // Pass clear function
          onPacketDeleted={handlePacketDeleted} // Add immediate refresh callback
          searchCriteria={multiSearchCriteria} // Pass multiSearchCriteria for highlighting
        />{' '}
      </div>
      <div className="lg:col-span-2 flex flex-col space-y-6">
        {' '}
        {/* Added a div for the charts and detail view */}
        <ProtocolDistribution packets={allPackets} />{' '}
        {/* Pass all packets to the chart */}
        <PacketDetailView
          packet={selectedPacket}
          isOpen={isDetailViewOpen}
          onOpenChange={handleDetailViewClose}
          searchCriteria={multiSearchCriteria} // Pass multiSearchCriteria for highlighting
          threats={selectedPacketThreats} // Pass filtered threats
        />
      </div>
    </div>
  );
};

export default PcapAnalysisPage;
