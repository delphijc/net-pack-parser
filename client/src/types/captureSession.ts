export interface CaptureSession {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    packetCount: number;
    fileSizeBytes: number;
    sha256: string;
    md5: string;
    interface?: string;
    filter?: string;
    serverUrl?: string;
}
