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

const LivePacketList: React.FC = () => {
    const { lastMessage, sendMessage, isConnected } = useWebSocketContext();
    const { packets, addPacket, isPaused, togglePause, clear, latencyMs } = useLiveStore();
    const [autoScroll, setAutoScroll] = useState(true);
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

    // Initial load/sync? Live view starts empty usually.

    // ... 

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

    // Map WebSocket PacketData to UI ParsedPacket
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
        <div className="flex flex-col h-full">
            <ConnectionBanner />
            <LiveFilterPanel sendMessage={(msg) => sendMessage(JSON.stringify(msg))} />
            <div className="flex justify-between items-center p-2 bg-secondary/20">
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePause}
                        className={isPaused ? "text-yellow-500" : "text-green-500"}
                    >
                        {isPaused ? <Play size={16} className="mr-2" /> : <Pause size={16} className="mr-2" />}
                        {isPaused ? "Resume" : "Pause Live"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clear}>
                        <Trash2 size={16} className="mr-2" /> Clear
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                            className="rounded bg-background border-white/10"
                        />
                        Auto-Scroll
                    </label>
                    <span className="text-xs text-muted-foreground">
                        Buffer: {packets.length} / 10000
                    </span>
                    <span className="text-xs text-muted-foreground border-l pl-2 ml-2">
                        Latency: {latencyMs} ms
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <PacketList
                    packets={uiPackets}
                    onPacketSelect={() => { }} // TODO: View details via REST fetch?
                    selectedPacketId={null}
                    onClearAllPackets={clear}
                />

                {autoScroll && <div ref={scrollEndRef} className="absolute bottom-0 h-1 w-full" />}
            </div>
        </div>
    );
};

export default LivePacketList;
