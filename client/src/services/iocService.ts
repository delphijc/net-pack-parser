import { api } from './api';

export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url';
  value: string;
  description?: string;
  source?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  mitreAttack?: string[];
  enabled: boolean;
  createdAt: string;
  lastUpdated: string;
}

class IOCService {
  async getAllIOCs(): Promise<IOC[]> {
    return api.getIocs();
  }

  async getIOCsByType(type: IOC['type']): Promise<IOC[]> {
    const all = await this.getAllIOCs();
    return all.filter(i => i.type === type);
  }

  async addIOC(ioc: IOC): Promise<void> {
    await api.addIoc(ioc);
  }

  async removeIOC(id: string): Promise<void> {
    await api.removeIoc(id);
  }

  async clearAll(): Promise<void> {
    // Not implemented on server yet, or loop delete?
    // For now, warn or no-op.
    console.warn('Clear All not implemented on server yet');
  }

  async importIOCs(
    iocs: IOC[],
    mode: 'merge' | 'replace' = 'merge',
  ): Promise<void> {
    if (mode === 'replace') {
      await this.clearAll();
    }
    for (const ioc of iocs) {
      await this.addIOC(ioc);
    }
  }

  async exportIOCs(): Promise<string> {
    const iocs = await this.getAllIOCs();
    return JSON.stringify(iocs, null, 2);
  }
}

export const iocService = new IOCService();
