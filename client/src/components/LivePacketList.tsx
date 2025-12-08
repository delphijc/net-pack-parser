import React, { useEffect, useRef, useState } from 'react';
import { useLiveStore } from '@/store/liveStore';
import { useWebSocketContext } from '@/context/WebSocketContext';
import PacketList from './PacketList';
import { liveProcessor } from '@/services/LiveProcessor';
import { WSMessageType } from '@/types/WebSocketMessages';
import type { PacketMessage } from '@/types/WebSocketMessages';
import { Button } from './ui/button';
import { Pause, Play, Trash2 } from 'lucide-react';
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
    const { packets, addPacket, isPaused, togglePause, clear, latencyMs } = useLiveStore();
    const [autoScroll, setAutoScroll] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
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
    }, [packets, autoScroll]);

    // Map WebSocket PacketData to UI ParsedPacket for PacketList component
    const uiPackets: ParsedPacket[] = packets.map(p => ({
        id: p.id,
        timestamp: p.timestamp,
        sourceIP: p.sourceIP,
        destIP: p.destinationIP,
        protocol: p.protocol,
        length: p.length,
        info: p.summary,
        detectedProtocols: [p.protocol],
        suspiciousIndicators: p.severity ? [{
            id: `${p.id}-simp`,
            type: 'live_threat',
            severity: p.severity,
            description: 'Threat detected in live stream',
            evidence: 'Real-time analysis',
            confidence: 80
        }] : [],
        rawData: new ArrayBuffer(0),
        tokens: [],
        sections: [],
        fileReferences: [],
        sourcePort: p.sourcePort,
        destPort: p.destinationPort
    }));

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] w-full overflow-hidden bg-background">
            {/* 
               Header Block: Contains all controls and visualization.
               This block does NOT scroll with the packets.
            */}
            <div className="flex-shrink-0 flex flex-col gap-4 p-4 border-b border-border bg-background">
                {/* 1. Connection Status */}
                <ConnectionBanner />

                {/* 2. Main Capture Controls (Interface, BPF, Start/Stop) */}
                <CaptureControls />

                {/* 3. Timeline Visualization */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <LiveTimelineView />
                </div>

                {/* 4. Filters and Playback Controls */}
                <div className="flex flex-col gap-2">
                    <LiveFilterPanel sendMessage={(msg) => sendMessage(JSON.stringify(msg))} />

                    {/* Playback & Stats Bar */}
                    <div className="flex justify-between items-center rounded-md border bg-muted/40 p-2">
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={togglePause}
                                className={isPaused ? "text-yellow-500 hover:text-yellow-600" : "text-green-500 hover:text-green-600"}
                            >
                                {isPaused ? <Play size={16} className="mr-2" /> : <Pause size={16} className="mr-2" />}
                                {isPaused ? "Resume" : "Pause Live"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowClearConfirm(true)}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 size={16} className="mr-2" /> Clear
                            </Button>
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
            <div className="flex-1 overflow-auto min-h-0 relative">
                <PacketList
                    packets={uiPackets}
                    onPacketSelect={() => { }}
                    selectedPacketId={null}
                    onClearAllPackets={clear}
                />
                {autoScroll && <div ref={scrollEndRef} className="h-1 w-full" />}
            </div>

            {/* Confirmation Dialog for Clear Action */}
            <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Live Buffer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear all captured packets from the live view? This action cannot be undone.
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
