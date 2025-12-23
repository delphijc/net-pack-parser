import React, { useEffect, useRef, useState } from 'react';
import { useLiveStore } from '@/store/liveStore';
import { useWebSocketContext } from '@/context/WebSocketContext';
import PacketList from './PacketList';
import { liveProcessor } from '@/services/LiveProcessor';
import { AgentClient } from '@/services/AgentClient';
import { WSMessageType } from '@/types/WebSocketMessages';
import type { PacketMessage } from '@/types/WebSocketMessages';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Pause, Play, Trash2, ListFilter } from 'lucide-react';
import type { ParsedPacket } from '@/types';
import { LiveFilterPanel } from './LiveFilterPanel';
import { ConnectionBanner } from './ConnectionBanner';
import { CaptureControls } from './CaptureControls';
import { LiveTimelineView } from './LiveTimelineView';
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

const LivePacketList: React.FC = () => {
  const { lastMessage, sendMessage, isConnected } = useWebSocketContext();
  const { packets, addPacket, isPaused, togglePause, clear, latencyMs } =
    useLiveStore();
  const [autoScroll, setAutoScroll] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [packetLimit, setPacketLimit] = useState<number>(10);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const prevConnectedRef = useRef(isConnected);

  // Clear buffer when reconnected (state sync)
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      // Just reconnected, clear stale data
      clear();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, clear]);

  // WebSocket Message Handling
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      try {
        const msg = JSON.parse(lastMessage.data);
        if (msg.type === WSMessageType.PACKET) {
          const pkt = (msg as PacketMessage).data;
          addPacket(pkt);
          liveProcessor.process(pkt);
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    }
  }, [lastMessage, addPacket]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [packets.length, autoScroll]); // Depend on length change

  // Map WebSocket PacketData to UI ParsedPacket for PacketList component
  const uiPackets: ParsedPacket[] = packets.map((p) => ({
    id: p.id,
    timestamp: p.timestamp,
    sourceIP: p.sourceIP,
    destIP: p.destinationIP,
    protocol: p.protocol,
    length: p.length,
    info: p.summary,
    detectedProtocols: [p.protocol],
    suspiciousIndicators: p.severity
      ? [
        {
          id: `${p.id}-simp`,
          type: 'live_threat',
          severity: p.severity,
          description: 'Threat detected in live stream',
          evidence: 'Real-time analysis',
          confidence: 80,
        },
      ]
      : [],
    rawData: new ArrayBuffer(0),
    tokens: [],
    sections: [],
    fileReferences: [],
    sourcePort: p.sourcePort,
    destPort: p.destinationPort,
  }));

  // Slice packets based on limit
  const visiblePackets = uiPackets.slice(-packetLimit);

  const handleExportPcap = async () => {
    if (currentSessionId) {
      try {
        // Step 1: Request a one-time download token (OTP/Nonce)
        const token = AgentClient.getToken();
        if (!token) {
          throw new Error('No active session token');
        }

        const response = await fetch(`/api/capture/token/${currentSessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to generate download token');
        }

        const data = await response.json();
        const downloadToken = data.token;

        // Step 2: Use the OTP in the URL for the browser download
        if (downloadToken) {
          window.open(
            `/api/capture/download/${currentSessionId}?download_token=${downloadToken}`,
            '_blank',
          );
        }
      } catch (error) {
        console.error('Failed to initiate secure download:', error);
        alert('Authentication failed for download.');
      }
    } else {
      console.warn('No active session ID for export');
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* 
               Header Block: Contains all controls and visualization.
               Sticky to ensure it's always visible.
            */}
      <div className="flex-shrink-0 flex flex-col gap-4 p-4 border-b border-border bg-background sticky top-0 z-50">
        {/* 1. Connection Status */}
        <ConnectionBanner />

        {/* 3. Filters and Playback Controls (Moved Timeline below Packet List in visual hierarchy, or at bottom of this fixed block? User asked: "move the "Live Timeline" panel below the "Captured Packets" panel")
                   WAIT: The "Captured Packets" panel is the SCROLLABLE area.
                   The user likely wants the Timeline BENEATH the scrollable list, effectively at the bottom of the screen?
                   OR just below the top controls but above the list?
                   "move the "Live Timeline" panel below the "Captured Packets" panel"
                   The PacketList fills the rest of the screen. Putting Timeline below it means pushing it to the very bottom footer.
                */}
        <div className="flex flex-col gap-2">
          <LiveFilterPanel
            sendMessage={(msg) => sendMessage(JSON.stringify(msg))}
          />

          {/* 2. Main Capture Controls (Interface, BPF, Start/Stop) */}
          <CaptureControls
            onCaptureStarted={(id) => setCurrentSessionId(id)}
            onCaptureStopped={() => {
              /* Optional: Keep session ID until cleared or new one starts? */
            }}
          />

          {/* Playback & Stats Bar */}
          <div className="flex justify-between items-center rounded-md border bg-muted/40 p-2">
            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                className={
                  isPaused
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-green-500 hover:text-green-600'
                }
              >
                {isPaused ? (
                  <Play size={16} className="mr-2" />
                ) : (
                  <Pause size={16} className="mr-2" />
                )}
                {isPaused ? 'Resume' : 'Pause Live'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} className="mr-2" /> Clear
              </Button>

              <div className="h-4 w-px bg-border mx-2" />

              <div className="flex items-center gap-2">
                <ListFilter size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Show last:
                </span>
                <Select
                  value={packetLimit.toString()}
                  onValueChange={(v) => setPacketLimit(Number(v))}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="75">75</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Auto-Scroll
              </label>
              <span>Buffer: {packets.length}/10000</span>
              <span>Latency: {latencyMs}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 
               Content Block: Scrollable Packet List
               Takes remaining height.
            */}
      <div className="flex-1 overflow-auto min-h-[100px] relative">
        <PacketList
          packets={visiblePackets}
          onPacketSelect={() => { }}
          selectedPacketId={null}
          onClearAllPackets={clear}
          onExportPcap={currentSessionId ? handleExportPcap : undefined}
        />
        {autoScroll && <div ref={scrollEndRef} className="h-1 w-full" />}

        {/* Timeline Visualization - Now part of scrollable content */}
        <div className="p-4 border-t border-border bg-background mt-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <LiveTimelineView />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Clear Action */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Live Buffer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all captured packets from the live
              view? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clear();
                setShowClearConfirm(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear Buffer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LivePacketList;
