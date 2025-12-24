import fs from 'fs';
import path from 'path';

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

export class IocService {
  private static instance: IocService;
  private iocs: IOC[] = [];
  // Store in a simple JSON file for persistence across restarts
  private readonly STORAGE_FILE = path.join(process.cwd(), 'data', 'iocs.json');

  private constructor() {
    this.loadIocs();
  }

  public static getInstance(): IocService {
    if (!IocService.instance) {
      IocService.instance = new IocService();
    }
    return IocService.instance;
  }

  private loadIocs() {
    try {
      if (fs.existsSync(this.STORAGE_FILE)) {
        const data = fs.readFileSync(this.STORAGE_FILE, 'utf-8');
        this.iocs = JSON.parse(data);
      } else {
        // Ensure data dir exists
        const dir = path.dirname(this.STORAGE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        this.iocs = [];
      }
    } catch (error) {
      console.error('Failed to load IOCs:', error);
      this.iocs = [];
    }
  }

  private saveIocs() {
    try {
      fs.writeFileSync(this.STORAGE_FILE, JSON.stringify(this.iocs, null, 2));
    } catch (error) {
      console.error('Failed to save IOCs:', error);
    }
  }

  public getIocs(): IOC[] {
    return this.iocs;
  }

  public addIoc(ioc: Omit<IOC, 'id' | 'createdAt' | 'lastUpdated'>): IOC {
    const now = new Date().toISOString();
    const newIoc: IOC = {
      ...ioc,
      id: crypto.randomUUID(),
      createdAt: now,
      lastUpdated: now,
      enabled: ioc.enabled !== undefined ? ioc.enabled : true,
      source: ioc.source || 'Manual',
      mitreAttack: ioc.mitreAttack || [],
    };
    this.iocs.push(newIoc);
    this.saveIocs();
    return newIoc;
  }

  public addIocIfNotExists(ioc: Omit<IOC, 'id' | 'createdAt' | 'lastUpdated'>): IOC {
    const existing = this.iocs.find(
      (i) => i.type === ioc.type && i.value === ioc.value,
    );
    if (existing) {
      return existing;
    }
    return this.addIoc(ioc);
  }

  public removeIoc(id: string): void {
    this.iocs = this.iocs.filter((i) => i.id !== id);
    this.saveIocs();
  }

  // Check a packet against all IOCs
  public checkPacket(packet: any): IOC[] {
    const matches: IOC[] = [];

    // Optimize: verify IPs specifically? For now, linear scan is okay for MVP size lists
    for (const ioc of this.iocs) {
      if (ioc.type === 'ip') {
        if (packet.sourceIp === ioc.value || packet.destIp === ioc.value) {
          matches.push(ioc);
        }
      } else if (ioc.type === 'domain') {
        // Check if domain is in packet info or DNS layer if available
        // Simple text match in info for now as fallback
        if (packet.info && packet.info.includes(ioc.value)) {
          matches.push(ioc);
        }
      } else if (ioc.type === 'hash') {
        // Not supported on individual packet usually, unless file extracted.
        // Skipped for packet-level check.
      }
    }
    return matches;
  }
}

export const iocService = IocService.getInstance();
