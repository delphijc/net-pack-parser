import type { ParsedPacket, ThreatAlert } from '../types';

// Use relative path by default to leverage Vite/Nginx proxies
export const SERVER_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = `${SERVER_URL}/api`;

export interface UploadResponse {
  sessionId: string;
  status: 'processing' | 'complete' | 'error';
  originalName: string;
  size: number;
}

export interface AnalysisStatus {
  status: 'processing' | 'complete' | 'error';
  progress: number;
  packetCount: number;
  error?: string;
}

export interface AnalysisResults {
  sessionId: string;
  status: 'complete';
  summary: {
    packetCount: number;
    totalBytes: number;
  };
  packets: any[]; // Raw packets from server, need adaptation
  total?: number;
}

export const api = {
  async uploadPcap(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('pcap', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  async ingestPackets(packets: ParsedPacket[], name: string): Promise<{ sessionId: string }> {
    // Prepare packets: convert ArrayBuffer rawData to Base64 string
    const preparedPackets = await Promise.all(packets.map(async (p) => {
      let rawBase64 = '';
      if (p.rawData instanceof ArrayBuffer) {
        // Convert ArrayBuffer to Base64
        const bytes = new Uint8Array(p.rawData);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        rawBase64 = btoa(binary);
      }

      return {
        ...p,
        rawData: rawBase64, // Send as encoded string
      };
    }));

    const response = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packets: preparedPackets,
        name
      })
    });

    if (!response.ok) {
      throw new Error(`Ingestion failed: ${response.statusText}`);
    }
    return response.json();
  },

  async getStatus(sessionId: string): Promise<AnalysisStatus> {
    const response = await fetch(
      `${API_BASE_URL}/analysis/${sessionId}/status`,
    );
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }
    return response.json();
  },

  async getResults(
    sessionId: string,
    from: number = 0,
    size: number = 1000,
  ): Promise<AnalysisResults> {
    const response = await fetch(
      `${API_BASE_URL}/analysis/${sessionId}/results?from=${from}&size=${size}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.statusText}`);
    }
    const data = await response.json();

    // Transform server packets to client ParsedPacket format
    if (data.packets) {
      data.packets = data.packets.map((p: any) => {
        // Convert base64 raw data back to ArrayBuffer
        let rawDataBuffer = new ArrayBuffer(0);
        if (p.raw && typeof p.raw === 'string') {
          try {
            const binaryString = atob(p.raw);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            rawDataBuffer = bytes.buffer;
          } catch (e) {
            console.error('Failed to decode raw packet data', e);
          }
        }

        return {
          id: p.id || `${sessionId}-${Math.random()}`,
          timestamp: new Date(p.timestamp).getTime(),
          sourceIP: p.sourceIp || '0.0.0.0',
          destIP: p.destIp || '0.0.0.0',
          sourcePort: p.sourcePort || 0,
          destPort: p.destPort || 0,
          protocol: p.protocol || 'Unknown',
          length: p.length || 0,
          rawData: rawDataBuffer,
          detectedProtocols: [p.protocol], // Basic init
          tokens: [],
          sections: [],
          fileReferences: p.fileReferences || [],
          extractedStrings: p.strings || [],
          threats: p.threats || [],
          suspiciousIndicators: (p.threats || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            severity: t.severity,
            description: t.description,
          })),
          threatIntelligence: [],
        };
      });
    }

    return data;
  },

  async getDashboardStats(sessionId: string): Promise<DashboardStats> {
    const response = await fetch(
      `${API_BASE_URL}/analysis/${sessionId}/stats`,
    );
    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`);
    }
    return response.json();
  },

  async getIocs(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/iocs`);
    if (!response.ok) throw new Error('Failed to fetch IOCs');
    return response.json();
  },

  async addIoc(ioc: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/iocs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ioc),
    });
    if (!response.ok) throw new Error('Failed to add IOC');
    return response.json();
  },

  async removeIoc(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/iocs/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove IOC');
  },

  async clearAllAnalysisData(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/clear-all`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to clear analysis data');
    return response.json();
  },
};

export interface DashboardStats {
  totalPackets: number;
  protocols: { key: string; doc_count: number }[];
  timeline: {
    key_as_string: string;
    doc_count: number;
    threat_packets?: { doc_count: number };
  }[];
  topTalkers: {
    src: { key: string; doc_count: number }[];
    dest: { key: string; doc_count: number }[];
  };
  threats: {
    bySeverity: { key: string; doc_count: number }[];
    byType: { key: string; doc_count: number }[];
    total: number;
    list?: ThreatAlert[];
  };
  files: {
    total: number;
  };
  geoDistribution: { key: string; doc_count: number }[];
  recentActivity: ParsedPacket[];
}
