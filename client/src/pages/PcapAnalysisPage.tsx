import React, { useState, useEffect, useCallback } from 'react';
import type { ParsedPacket } from '@/types'; // Changed ParsedPacket to Packet as per bpfFilter.ts import
import PacketList from '@/components/PacketList';
import PacketDetailView from '@/components/PacketDetailView';
import { ProtocolFilter } from '@/components/ProtocolFilter';
import { ProtocolDistributionChart } from '@/components/ProtocolDistributionChart'; // Import ProtocolDistributionChart
import database from '@/services/database'; // Import database service
import { FilterBar } from '@/components/FilterBar'; // Import FilterBar
import { matchBpfFilter, validateBpfFilter } from '@/utils/bpfFilter'; // Import BPF filter utilities
import type { BpfAST } from '@/utils/bpfFilter';
import AdvancedSearchPanel from '@/components/AdvancedSearchPanel'; // Import AdvancedSearchPanel
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Import Collapsible components
import { Button } from '@/components/ui/button'; // Import Button for the trigger
import { ChevronDownIcon } from 'lucide-react'; // Import an icon for the trigger
import { multiCriteriaSearch, type MultiSearchCriteria } from '@/utils/multiCriteriaSearch'; // Import multiCriteriaSearch utilities
import { cn } from '@/lib/utils';

const PcapAnalysisPage: React.FC = () => {
  const [allPackets, setAllPackets] = useState<ParsedPacket[]>([]); // All packets loaded from DB
  const [displayedPackets, setDisplayedPackets] = useState<ParsedPacket[]>([]); // Packets after filtering
  const [selectedPacket, setSelectedPacket] = useState<ParsedPacket | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | undefined>(undefined);
  const [availableProtocols, setAvailableProtocols] = useState<string[]>([]);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false); // State for Advanced Search Panel visibility
  const [multiSearchCriteria, setMultiSearchCriteria] = useState<MultiSearchCriteria | null>(null); // State for advanced search criteria

  // BPF Filter State
  const [bpfFilterAst, setBpfFilterAst] = useState<BpfAST | null>(null);
  const [bpfFilterError, setBpfFilterError] = useState<string | undefined>(undefined);

  // Polling for packets from the database
  useEffect(() => {
    const loadPackets = async () => {
      const packetsFromDb = await database.getAllPackets();
      setAllPackets(packetsFromDb);

      // Extract unique protocols for the filter
      const uniqueProtocols = Array.from(
        new Set(packetsFromDb.flatMap((p) => p.detectedProtocols || []))
      );
      setAvailableProtocols(uniqueProtocols);
    };

    loadPackets(); // Load initially

    const intervalId = setInterval(() => {
      loadPackets();
    }, 100); // Poll every 0.1 seconds for faster updates

    return () => clearInterval(intervalId);
  }, []);

  // Filter packets whenever allPackets, selectedProtocol, BPF filter, or multi-criteria search changes
  useEffect(() => {
    let filtered = allPackets;

    // Apply protocol filter first
    if (selectedProtocol && selectedProtocol !== 'ALL') {
      filtered = filtered.filter((p) => p.detectedProtocols?.includes(selectedProtocol));
    }

    // Apply BPF filter
    if (bpfFilterAst) {
      filtered = filtered.filter((packet) => matchBpfFilter(packet, bpfFilterAst));
    }

    // Apply multi-criteria search filter
    if (multiSearchCriteria) {
      filtered = filtered.filter((packet) => multiCriteriaSearch(packet, multiSearchCriteria));
    }

    setDisplayedPackets(filtered);
  }, [allPackets, selectedProtocol, bpfFilterAst, multiSearchCriteria]);


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
    database.clearAllData();
    setAllPackets([]);
    setDisplayedPackets([]);
    setSelectedPacket(null);
    setAvailableProtocols([]);
    setBpfFilterAst(null);
    setBpfFilterError(undefined);
  };

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
            <h4 className="text-sm font-semibold">
              Advanced Search
            </h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDownIcon className={cn("h-4 w-4", isAdvancedSearchOpen ? "rotate-180" : "")} />
                <span className="sr-only">Toggle Advanced Search</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <AdvancedSearchPanel onSearch={handleAdvancedSearch} onClear={handleClearAdvancedSearch} />
          </CollapsibleContent>                  </Collapsible>

        <PacketList

          packets={displayedPackets} // Pass filtered packets to PacketList

          onPacketSelect={handlePacketSelect}

          selectedPacketId={selectedPacketId}

          onClearAllPackets={handleClearAllPackets} // Pass clear function

          searchCriteria={multiSearchCriteria} // Pass multiSearchCriteria for highlighting

        />      </div>
      <div className="lg:col-span-2 flex flex-col space-y-6"> {/* Added a div for the charts and detail view */}
        <ProtocolDistributionChart packets={allPackets} /> {/* Pass all packets to the chart */}
        <PacketDetailView
          packet={selectedPacket}
          isOpen={isDetailViewOpen}
          onOpenChange={handleDetailViewClose}
          searchCriteria={multiSearchCriteria} // Pass multiSearchCriteria for highlighting
        />
      </div>
    </div>
  );
};

export default PcapAnalysisPage;