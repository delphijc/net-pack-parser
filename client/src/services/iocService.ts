import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import initialIOCs from '../data/initialIOCs.json';

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

interface IOCDB extends DBSchema {
  iocs: {
    key: string;
    value: IOC;
    indexes: { 'by-type': string; 'by-value': string };
  };
}

const DB_NAME = 'net-pack-parser-iocs';
const DB_VERSION = 1;

class IOCService {
  private dbPromise: Promise<IDBPDatabase<IOCDB>>;
  private ipCache: Set<string> = new Set();
  private domainCache: Set<string> = new Set();
  private hashCache: Set<string> = new Set();
  private urlCache: Set<string> = new Set();
  private iocMap: Map<string, IOC> = new Map(); // Map value to full IOC object for retrieval

  constructor() {
    this.dbPromise = this.initDB();
    this.loadCache();
  }

  private async initDB() {
    return openDB<IOCDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('iocs', { keyPath: 'id' });
        store.createIndex('by-type', 'type');
        store.createIndex('by-value', 'value');

        // Seed initial data
        initialIOCs.forEach((ioc) => {
          store.put(ioc as IOC);
        });
      },
    });
  }

  private async loadCache() {
    const db = await this.dbPromise;
    const allIOCs = await db.getAll('iocs');
    this.ipCache.clear();
    this.domainCache.clear();
    this.hashCache.clear();
    this.urlCache.clear();
    this.iocMap.clear();

    allIOCs.forEach((ioc) => {
      if (ioc.enabled) {
        this.addToCache(ioc);
      }
    });
  }

  private addToCache(ioc: IOC) {
    this.iocMap.set(ioc.value, ioc);
    switch (ioc.type) {
      case 'ip':
        this.ipCache.add(ioc.value);
        break;
      case 'domain':
        this.domainCache.add(ioc.value);
        break;
      case 'hash':
        this.hashCache.add(ioc.value);
        break;
      case 'url':
        this.urlCache.add(ioc.value);
        break;
    }
  }

  private removeFromCache(ioc: IOC) {
    this.iocMap.delete(ioc.value);
    switch (ioc.type) {
      case 'ip':
        this.ipCache.delete(ioc.value);
        break;
      case 'domain':
        this.domainCache.delete(ioc.value);
        break;
      case 'hash':
        this.hashCache.delete(ioc.value);
        break;
      case 'url':
        this.urlCache.delete(ioc.value);
        break;
    }
  }

  getIOCCache() {
    return {
      ip: this.ipCache,
      domain: this.domainCache,
      hash: this.hashCache,
      url: this.urlCache,
      map: this.iocMap,
    };
  }

  async getAllIOCs(): Promise<IOC[]> {
    const db = await this.dbPromise;
    return db.getAll('iocs');
  }

  async getIOCsByType(type: IOC['type']): Promise<IOC[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('iocs', 'by-type', type);
  }

  async addIOC(ioc: IOC): Promise<void> {
    const db = await this.dbPromise;
    await db.put('iocs', ioc);
    if (ioc.enabled) {
      this.addToCache(ioc);
    }
  }

  async removeIOC(id: string): Promise<void> {
    const db = await this.dbPromise;
    const ioc = await db.get('iocs', id);
    if (ioc) {
      await db.delete('iocs', id);
      this.removeFromCache(ioc);
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('iocs');
    this.ipCache.clear();
    this.domainCache.clear();
    this.hashCache.clear();
    this.urlCache.clear();
    this.iocMap.clear();
  }

  async importIOCs(
    iocs: IOC[],
    mode: 'merge' | 'replace' = 'merge',
  ): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('iocs', 'readwrite');

    if (mode === 'replace') {
      await tx.store.clear();
      this.ipCache.clear();
      this.domainCache.clear();
      this.hashCache.clear();
      this.urlCache.clear();
      this.iocMap.clear();
    }

    for (const ioc of iocs) {
      await tx.store.put(ioc);
      if (ioc.enabled) {
        this.addToCache(ioc);
      }
    }

    await tx.done;
  }

  async exportIOCs(): Promise<string> {
    const iocs = await this.getAllIOCs();
    return JSON.stringify(iocs, null, 2);
  }
}

export const iocService = new IOCService();
