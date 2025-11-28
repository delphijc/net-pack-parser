import React, { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Import Tabs components
import ExtractedStringsTab from '@/components/ExtractedStringsTab'; // Import ExtractedStringsTab
import FilesTab from '@/components/FilesTab'; // Import FilesTab

interface PacketDetailViewProps {
  packet: ParsedPacket | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PacketDetailView: React.FC<PacketDetailViewProps> = ({ packet, isOpen, onOpenChange }) => {
  const [highlightRanges, setHighlightRanges] = useState<{ offset: number; length: number }[]>([]); // New state for highlight ranges

  if (!packet) {
    return null;
  }

  // Helper to format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Convert ParsedPacket to Packet-like structure for decoder
  const getRawDataBuffer = (data: string | ArrayBuffer): ArrayBuffer => {
    if (data instanceof ArrayBuffer) {
      return data;
    }
    try {
      return new TextEncoder().encode(data).buffer;
    } catch (e) {
      return new ArrayBuffer(0);
    }
  };

  const rawDataBuffer = getRawDataBuffer(packet.rawData);

  // Construct a temporary Packet object for the decoder
  const tempPacket: Packet = {
    id: packet.id,
    timestamp: packet.timestamp,
    sourceIP: packet.sourceIP,
    destIP: packet.destIP,
    sourcePort: packet.sourcePort || 0,
    destPort: packet.destPort || 0,
    protocol: packet.protocol,
    length: rawDataBuffer.byteLength,
    rawData: rawDataBuffer,
    detectedProtocols: packet.detectedProtocols || []
  };

  const decodedHeaders = decodePacketHeaders(tempPacket);

  const handleCopyHex = async () => {
    if (rawDataBuffer && rawDataBuffer.byteLength > 0) {
      const hexDump = generateHexDump(rawDataBuffer);
      try {
        await navigator.clipboard.writeText(hexDump.lines.map(l => `${l.offset} ${l.hexBytes} ${l.asciiChars}`).join('\n'));
        console.log('Hex dump copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy hex dump: ', err);
      }
    }
  };

  const handleCopyAscii = async () => {
    if (rawDataBuffer && rawDataBuffer.byteLength > 0) {
      const { fullAsciiDump } = generateHexDump(rawDataBuffer);
      try {
        await navigator.clipboard.writeText(fullAsciiDump);
        console.log('ASCII dump copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy ASCII dump: ', err);
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

  // Callback for ExtractedStringsTab to set highlight ranges
  const handleHighlightString = (offset: number, length: number) => {
    setHighlightRanges([{ offset, length }]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl flex flex-col bg-background/95 backdrop-blur-md border-l border-white/10 p-0 sm:max-w-2xl">
        <SheetHeader className="p-6 border-b border-white/10">
          <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            Packet Details
            <span className="text-sm font-normal text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded">ID: {packet.id}</span>
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Detailed view of the selected network packet.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Packet Summary */}
          <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Timestamp</p>
                <p className="font-mono text-foreground">{formatTimestamp(packet.timestamp)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Protocol</p>
                <p className="font-mono text-foreground">{packet.protocol}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Source</p>
                <p className="font-mono text-foreground">{packet.sourceIP}{packet.sourcePort ? `:${packet.sourcePort}` : ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Destination</p>
                <p className="font-mono text-foreground">{packet.destIP}{packet.destPort ? `:${packet.destPort}` : ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Length</p>
                <p className="font-mono text-foreground">{rawDataBuffer.byteLength} bytes</p>
              </div>
            </div>
          </div>

          {/* Decoded Headers */}
          <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-accent rounded-full"></span>
              Decoded Headers
            </h3>
            <div className="space-y-2 text-sm">
              {decodedHeaders.map((header, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground font-medium">{header.name}</span>
                  <span className="font-mono text-foreground text-right">
                    {header.value} {header.description && <span className="text-muted-foreground/70 ml-1">({header.description})</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs for Hex Dump and Extracted Strings */}
          <Tabs defaultValue="hex-dump" className="w-full">
            <TabsList className="grid w-full grid-cols-3"> {/* Changed grid-cols-2 to grid-cols-3 */}
              <TabsTrigger value="hex-dump">Hex Dump / ASCII</TabsTrigger>
              <TabsTrigger value="extracted-strings">Extracted Strings</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger> {/* New tab trigger */}
            </TabsList>
            <TabsContent value="hex-dump">
              <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm mt-4">
                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                  Payload Hex Dump / ASCII
                </h3>
                <div className="bg-black/40 rounded border border-white/5 p-2 overflow-hidden">
                  {rawDataBuffer && rawDataBuffer.byteLength > 0 ? (
                    <HexDumpViewer rawData={rawDataBuffer} highlightRanges={highlightRanges} /> // Pass highlightRanges
                  ) : (
                    <p className="text-muted-foreground text-sm p-4 text-center">No payload data available.</p>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="extracted-strings">
              <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm mt-4">
                <ExtractedStringsTab
                  extractedStrings={packet.extractedStrings || []}
                  onHighlight={handleHighlightString} // Pass the callback
                />
              </div>
            </TabsContent>
            {/* New TabsContent for Files */}
            <TabsContent value="files">
              <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm mt-4">
                <FilesTab packet={packet} />
              </div>
            </TabsContent>
          </Tabs>

          {/* Copy/Download buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={handleCopyHex} disabled={!rawDataBuffer || rawDataBuffer.byteLength === 0} className="flex-1">
              Copy Hex
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyAscii} disabled={!rawDataBuffer || rawDataBuffer.byteLength === 0} className="flex-1">
              Copy ASCII
            </Button>
            <Button variant="default" size="sm" onClick={handleDownloadPacket} disabled={!rawDataBuffer || rawDataBuffer.byteLength === 0} className="flex-1">
              Download
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PacketDetailView;
