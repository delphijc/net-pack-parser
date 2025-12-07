export const WSMessageType = {
    SUBSCRIBE: 'SUBSCRIBE',
    UPDATE_FILTER: 'UPDATE_FILTER',
    PACKET: 'PACKET',
    STATS: 'STATS',
    ERROR: 'ERROR'
} as const;

export type WSMessageType = typeof WSMessageType[keyof typeof WSMessageType];

export interface PacketFilter {
    protocol?: string;
    sourceIP?: string;
    destinationIP?: string;
    port?: number;
}

export interface PacketData {
    id: string; // Unique ID (e.g. UUID)
    timestamp: number;
    protocol: string;
    sourceIP: string;
    destinationIP: string;
    sourcePort: number;
    destinationPort: number;
    length: number;
    summary: string;
    payload?: string; // Base64 or text for analysis
    severity?: 'low' | 'medium' | 'high' | 'critical'; // For threat tagging
}

export interface CaptureStats {
    packetsCaptured: number;
    packetsDropped: number;
    bytesCaptured: number;
    activeConnections: number;
    durationMs: number;
}

// Client -> Server
export interface SubscribeMessage {
    type: typeof WSMessageType.SUBSCRIBE;
    filters?: PacketFilter;
}

// Server -> Client
export interface PacketMessage {
    type: typeof WSMessageType.PACKET;
    data: PacketData;
}

export interface StatsMessage {
    type: typeof WSMessageType.STATS;
    stats: CaptureStats;
}

export interface ErrorMessage {
    type: typeof WSMessageType.ERROR;
    code: string;
    message: string;
}

export type WSClientMessage = SubscribeMessage | UpdateFilterMessage;

export interface UpdateFilterMessage {
    type: typeof WSMessageType.UPDATE_FILTER;
    filters: PacketFilter;
}

export type WSServerMessage = PacketMessage | StatsMessage | ErrorMessage;
