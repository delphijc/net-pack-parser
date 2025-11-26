declare module 'pcap-decoder' {
    export class PcapDecoder {
        constructor(data: ArrayBuffer | Uint8Array);
        decode(): Packet[];
        on(event: 'packet', callback: (packet: Packet) => void): void;
        on(event: 'end', callback: () => void): void;
        on(event: 'error', callback: (error: Error) => void): void;
    }

    export interface Packet {
        header: PacketHeader;
        data: Uint8Array;
    }

    export interface PacketHeader {
        timestampSeconds: number;
        timestampMicroseconds: number;
        capturedLength: number;
        originalLength: number;
    }
}
