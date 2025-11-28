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

const PcapAnalysisPage: React.FC = () => {
  const [allPackets, setAllPackets] = useState<ParsedPacket[]>([]); // All packets loaded from DB
  const [displayedPackets, setDisplayedPackets] = useState<ParsedPacket[]>([]); // Packets after filtering
  const [selectedPacket, setSelectedPacket] = useState<ParsedPacket | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | undefined>(undefined);
  const [availableProtocols, setAvailableProtocols] = useState<string[]>([]);

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

  // Filter packets whenever allPackets, selectedProtocol, or BPF filter changes
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

    setDisplayedPackets(filtered);
  }, [allPackets, selectedProtocol, bpfFilterAst]);


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
        <PacketList
          packets={displayedPackets} // Pass filtered packets to PacketList
          onPacketSelect={handlePacketSelect}
          selectedPacketId={selectedPacketId}
          onClearAllPackets={handleClearAllPackets} // Pass clear function
        />
      </div>
      <div className="lg:col-span-2 flex flex-col space-y-6"> {/* Added a div for the charts and detail view */}
        <ProtocolDistributionChart packets={allPackets} /> {/* Pass all packets to the chart */}
        <PacketDetailView
          packet={selectedPacket}
          isOpen={isDetailViewOpen}
          onOpenChange={handleDetailViewClose}
        />
      </div>
    </div>
  );
};

export default PcapAnalysisPage;