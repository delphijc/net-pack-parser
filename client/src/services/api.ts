const API_BASE_URL = 'http://localhost:3000/api';

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
    return response.json();
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
};

export interface DashboardStats {
  totalPackets: number;
  protocols: { key: string; doc_count: number }[];
  timeline: { key_as_string: string; doc_count: number }[];
  topTalkers: {
    src: { key: string; doc_count: number }[];
    dest: { key: string; doc_count: number }[];
  };
  threats: {
    bySeverity: { key: string; doc_count: number }[];
    byType: { key: string; doc_count: number }[];
    total: number;
  };
  files: {
    total: number;
  };
  recentActivity: any[];
}
