import { create } from 'zustand';
import type { PacketData } from '../types/WebSocketMessages';

interface LiveState {
    packets: PacketData[];
    isPaused: boolean;
    bufferLimit: number;
    latencyMs: number; // Rolling average latency
    addPacket: (packet: PacketData) => void;
    updatePacket: (id: string, updates: Partial<PacketData>) => void;
    togglePause: () => void;
    setPaused: (paused: boolean) => void;
    clear: () => void;
    setBufferLimit: (limit: number) => void;
}

const LATENCY_SMOOTHING = 0.1; // Exponential moving average factor

export const useLiveStore = create<LiveState>((set) => ({
    packets: [],
    isPaused: false,
    bufferLimit: 10000,
    latencyMs: 0,

    addPacket: (packet) => set((state) => {
        if (state.isPaused) return state;

        const newPackets = [...state.packets, packet];
        if (newPackets.length > state.bufferLimit) {
            newPackets.shift();
        }

        // Calculate latency
        const now = Date.now();
        const pktLatency = now - packet.timestamp;
        const newLatency = state.latencyMs === 0
            ? pktLatency
            : state.latencyMs * (1 - LATENCY_SMOOTHING) + pktLatency * LATENCY_SMOOTHING;

        return { packets: newPackets, latencyMs: Math.round(newLatency) };
    }),

    updatePacket: (id, updates) => set((state) => ({
        packets: state.packets.map(p =>
            p.id === id ? { ...p, ...updates } : p
        )
    })),

    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setPaused: (paused) => set({ isPaused: paused }),

    clear: () => set({ packets: [], latencyMs: 0 }),

    setBufferLimit: (limit) => set((state) => {
        let newPackets = state.packets;
        if (newPackets.length > limit) {
            newPackets = newPackets.slice(newPackets.length - limit);
        }
        return { bufferLimit: limit, packets: newPackets };
    })
}));

