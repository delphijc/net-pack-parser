import React, { useState, useEffect } from 'react';
import type { ParsedPacket } from '@/types';
import PacketList from '@/components/PacketList';
import PacketDetailView from '@/components/PacketDetailView';
import { ProtocolFilter } from '@/components/ProtocolFilter';
import { ProtocolDistributionChart } from '@/components/ProtocolDistributionChart'; // Import ProtocolDistributionChart
import database from '@/services/database'; // Import database service

const PcapAnalysisPage: React.FC = () => {
  const [allPackets, setAllPackets] = useState<ParsedPacket[]>([]); // All packets loaded from DB
  const [displayedPackets, setDisplayedPackets] = useState<ParsedPacket[]>([]); // Packets after filtering
  const [selectedPacket, setSelectedPacket] = useState<ParsedPacket | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | undefined>(undefined);
  const [availableProtocols, setAvailableProtocols] = useState<string[]>([]);

  // Polling for packets from the database
  useEffect(() => {
    const loadPackets = () => {
      const packetsFromDb = database.getAllPackets();
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
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Filter packets whenever allPackets or selectedProtocol changes
  useEffect(() => {
    let filtered = allPackets;
    if (selectedProtocol && selectedProtocol !== 'ALL') {
      filtered = allPackets.filter((p) => p.detectedProtocols?.includes(selectedProtocol));
    }
    setDisplayedPackets(filtered);
  }, [allPackets, selectedProtocol]);

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
  };

  const selectedPacketId = selectedPacket ? selectedPacket.id : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] p-6">
      <div className="lg:col-span-1 flex flex-col space-y-4">
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