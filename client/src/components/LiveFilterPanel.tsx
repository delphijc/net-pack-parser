import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';
import { WSMessageType, type PacketFilter } from '@/types/WebSocketMessages';

interface LiveFilterPanelProps {
    sendMessage: (msg: object) => void;
}

export const LiveFilterPanel: React.FC<LiveFilterPanelProps> = ({ sendMessage }) => {
    const [protocol, setProtocol] = useState('');
    const [sourceIP, setSourceIP] = useState('');
    const [destinationIP, setDestinationIP] = useState('');
    const [port, setPort] = useState('');

    const applyFilter = useCallback(() => {
        const filters: PacketFilter = {};
        if (protocol) filters.protocol = protocol;
        if (sourceIP) filters.sourceIP = sourceIP;
        if (destinationIP) filters.destinationIP = destinationIP;
        if (port) filters.port = parseInt(port, 10);

        sendMessage({ type: WSMessageType.UPDATE_FILTER, filters });
    }, [protocol, sourceIP, destinationIP, port, sendMessage]);

    const clearFilter = useCallback(() => {
        setProtocol('');
        setSourceIP('');
        setDestinationIP('');
        setPort('');
        sendMessage({ type: WSMessageType.UPDATE_FILTER, filters: {} });
    }, [sendMessage]);

    return (
        <div className="flex flex-wrap items-end gap-3 p-4 border rounded-lg bg-card">
            <div className="flex-1 min-w-[120px]">
                <Label htmlFor="filter-protocol" className="text-xs">Protocol</Label>
                <Input
                    id="filter-protocol"
                    placeholder="TCP, UDP, etc."
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="h-8"
                />
            </div>
            <div className="flex-1 min-w-[140px]">
                <Label htmlFor="filter-srcip" className="text-xs">Source IP</Label>
                <Input
                    id="filter-srcip"
                    placeholder="192.168.1.1"
                    value={sourceIP}
                    onChange={(e) => setSourceIP(e.target.value)}
                    className="h-8"
                />
            </div>
            <div className="flex-1 min-w-[140px]">
                <Label htmlFor="filter-dstip" className="text-xs">Dest IP</Label>
                <Input
                    id="filter-dstip"
                    placeholder="10.0.0.1"
                    value={destinationIP}
                    onChange={(e) => setDestinationIP(e.target.value)}
                    className="h-8"
                />
            </div>
            <div className="w-24">
                <Label htmlFor="filter-port" className="text-xs">Port</Label>
                <Input
                    id="filter-port"
                    placeholder="443"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="h-8"
                />
            </div>
            <Button size="sm" onClick={applyFilter} className="gap-1">
                <Filter className="h-4 w-4" />
                Apply
            </Button>
            <Button size="sm" variant="outline" onClick={clearFilter} className="gap-1">
                <X className="h-4 w-4" />
                Clear
            </Button>
        </div>
    );
};
