import React, { useState } from 'react';
import type { ParsedPacket } from '@/types';
import PacketList from '@/components/PacketList';
import PacketDetailView from '@/components/PacketDetailView';

const PcapAnalysisPage: React.FC = () => {

  const [selectedPacket, setSelectedPacket] = useState<ParsedPacket | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  const handlePacketSelect = (packet: ParsedPacket | null) => {
    setSelectedPacket(packet);
    setIsDetailViewOpen(!!packet); // Open detail view if a packet is selected, close if null
  };

  const handleDetailViewClose = (open: boolean) => {
    setIsDetailViewOpen(open);
    if (!open) {
      setSelectedPacket(null); // Clear selected packet when detail view closes
    }
  };

  // This will eventually need to filter from the full packets list managed here
  // For now, PacketList has its own internal filtering
  const selectedPacketId = selectedPacket ? selectedPacket.id : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] p-6">
      <div className="lg:col-span-1">
        <PacketList
          onPacketSelect={handlePacketSelect}
          selectedPacketId={selectedPacketId}
        />
      </div>
      <PacketDetailView
        packet={selectedPacket}
        isOpen={isDetailViewOpen}
        onOpenChange={handleDetailViewClose}
      />
    </div>
  );
};

export default PcapAnalysisPage;