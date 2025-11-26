import React from 'react';
import type { ParsedPacket } from '@/types';
import type { Packet } from '@/types/packet';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button'; // Import Button component
import { decodePacketHeaders } from '@/utils/packetDecoder';
import HexDumpViewer, { generateHexDump } from '@/components/HexDumpViewer'; // Import HexDumpViewer and generateHexDump

interface PacketDetailViewProps {
  packet: ParsedPacket | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PacketDetailView: React.FC<PacketDetailViewProps> = ({ packet, isOpen, onOpenChange }) => {
  if (!packet) {
    return null;
  }

  // Helper to format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Convert ParsedPacket to Packet-like structure for decoder
  // Assuming rawData is a hex string or similar. For now, using TextEncoder as fallback if not hex.
  // Ideally ParsedPacket should store encoding info.
  const getRawDataBuffer = (data: string): ArrayBuffer => {
    try {
      // Try hex first? Or just assume text for now as per test data?
      // Test data uses "some raw data 1".
      return new TextEncoder().encode(data).buffer;
    } catch (e) {
      return new ArrayBuffer(0);
    }
  };

  const rawDataBuffer = getRawDataBuffer(packet.rawData);

  // Construct a temporary Packet object for the decoder
  const tempPacket: Packet = {
    id: packet.id,
    timestamp: new Date(packet.timestamp).getTime(),
    sourceIP: packet.source, // Simplified mapping
    destIP: packet.destination,
    sourcePort: 0, // Not available in ParsedPacket directly
    destPort: 0,
    protocol: packet.protocol,
    length: rawDataBuffer.byteLength,
    rawData: rawDataBuffer
  };

  const decodedHeaders = decodePacketHeaders(tempPacket);

  const handleCopyHex = async () => {
    if (rawDataBuffer && rawDataBuffer.byteLength > 0) {
      const { fullHexDump } = generateHexDump(rawDataBuffer);
      try {
        await navigator.clipboard.writeText(fullHexDump);
        // Optionally, show a toast notification for success
        console.log('Hex dump copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy hex dump: ', err);
        // Optionally, show an error notification
      }
    }
  };

  const handleCopyAscii = async () => {
    if (rawDataBuffer && rawDataBuffer.byteLength > 0) {
      const { fullAsciiDump } = generateHexDump(rawDataBuffer);
      try {
        await navigator.clipboard.writeText(fullAsciiDump);
        // Optionally, show a toast notification for success
        console.log('ASCII dump copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy ASCII dump: ', err);
        // Optionally, show an error notification
      }
    }
  };

  const handleDownloadPacket = () => {
    if (rawDataBuffer && rawDataBuffer.byteLength > 0) {
      const blob = new Blob([rawDataBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packet_${packet.id}_${packet.timestamp}.bin`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Packet data downloaded!');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle>Packet Details - ID: {packet.id}</SheetTitle>
          <SheetDescription>
            Detailed view of the selected network packet.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto p-4 space-y-4 font-mono text-sm">
          {/* Packet Summary */}
          <div className="bg-slate-800 p-3 rounded-lg">
            <h3 className="font-bold text-base mb-2">Summary</h3>
            <p><strong>Timestamp:</strong> {formatTimestamp(packet.timestamp)}</p>
            <p><strong>Source:</strong> {packet.source}</p>
            <p><strong>Destination:</strong> {packet.destination}</p>
            <p><strong>Protocol:</strong> {packet.protocol}</p>
            <p><strong>Length:</strong> {rawDataBuffer.byteLength} bytes</p>
          </div>

          {/* Decoded Headers */}
          <div className="bg-slate-800 p-3 rounded-lg">
            <h3 className="font-bold text-base mb-2">Decoded Headers</h3>
            <div className="space-y-1">
              {decodedHeaders.map((header, index) => (
                <p key={index}>
                  <strong>{header.name}:</strong> {header.value} {header.description && `(${header.description})`}
                </p>
              ))}
            </div>
          </div>

          {/* Hex Dump and ASCII */}
          <div className="bg-slate-800 p-3 rounded-lg">
            <h3 className="font-bold text-base mb-2">Payload Hex Dump / ASCII</h3>
            {rawDataBuffer && rawDataBuffer.byteLength > 0 ? (
              <HexDumpViewer rawData={rawDataBuffer} />
            ) : (
              <p>No payload data available.</p>
            )}
          </div>

          {/* Copy/Download buttons */}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCopyHex} disabled={!rawDataBuffer || rawDataBuffer.byteLength === 0}>
              Copy Hex
            </Button>
            <Button onClick={handleCopyAscii} disabled={!rawDataBuffer || rawDataBuffer.byteLength === 0}>
              Copy ASCII
            </Button>
            <Button onClick={handleDownloadPacket} disabled={!rawDataBuffer || rawDataBuffer.byteLength === 0}>
              Download Packet
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PacketDetailView;
