export interface Bookmark {
    id: string;
    timestamp: number;
    label: string;
    note: string;
    author?: string;
    packetId?: string;
}
