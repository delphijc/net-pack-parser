import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedPacket } from '../types';
import { reassembleTcpStream } from '../utils/tcpReassembly';
import type { ReassembledStream } from '../utils/tcpReassembly';

interface StreamFollowerProps {
    isOpen: boolean;
    onCloseOperation: () => void;
    flowId: string;
    packets: ParsedPacket[];
}

export const StreamFollower: React.FC<StreamFollowerProps> = ({
    isOpen,
    onCloseOperation,
    flowId,
    packets,
}) => {
    const [viewMode, setViewMode] = useState<'ascii' | 'hex'>('ascii');

    const streamData: ReassembledStream = useMemo(() => {
        if (!isOpen || !flowId) return { flowId, segments: [], totalPayloadSize: 0, startTime: 0, endTime: 0 };
        return reassembleTcpStream(packets, flowId);
    }, [isOpen, flowId, packets]);

    const formatContent = (buffer: ArrayBuffer, mode: 'ascii' | 'hex') => {
        const decoder = new TextDecoder('utf-8'); // Using utf-8 for ASCII view, might need more robust encoding handling
        if (mode === 'ascii') {
            // Replace non-printable characters for display
            // return decoder.decode(buffer).replace(/[^\x20-\x7E\n\r\t]/g, '.');
            return decoder.decode(buffer);
        } else {
            // Hex Dump
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseOperation()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Follow TCP Stream</DialogTitle>
                    <DialogDescription>
                        Stream ID: {flowId} | Total payload: {streamData.totalPayloadSize} bytes
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-between items-center py-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'ascii' | 'hex')}>
                        <TabsList>
                            <TabsTrigger value="ascii">ASCII</TabsTrigger>
                            <TabsTrigger value="hex">Hex Dump</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button variant="outline" onClick={onCloseOperation}>Close</Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md p-4 bg-background font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {streamData.segments.length === 0 ? (
                        <div className="text-muted-foreground text-center italic">No payload data found for this stream.</div>
                    ) : (
                        streamData.segments.map((segment) => (
                            <span
                                key={segment.packetId}
                                className={
                                    segment.direction === 'client-to-server'
                                        ? 'text-red-500'
                                        : 'text-blue-500'
                                }
                                title={`Seq: ${segment.seq} | Len: ${segment.len}`}
                            >
                                {formatContent(segment.payload, viewMode)}
                            </span>
                        ))
                    )}
                </ScrollArea>

                <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                    <span className="text-red-500">● Client → Server</span>
                    <span className="text-blue-500">● Server → Client</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};
