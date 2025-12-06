import type {
  ParsedPacket,
  FileReference,
  PerformanceEntryData,
} from '../types';
import type { ForensicCase, TimelineEvent, ThreatIntelligence } from '../types';
import type { CaptureSession } from '../types/captureSession';

const DB_NAME = 'networkParserDB';
const DB_VERSION = 2; // Increment version if schema changes

class DatabaseService {
  private static instance: DatabaseService;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase>;
  // private packets: ParsedPacket[] = []; // Removed as now handled by IndexedDB
  private performanceEntries: PerformanceEntryData[] = [];
  private forensicCases: ForensicCase[] = [];
  private timelineEvents: TimelineEvent[] = [];
  private threatIntelligence: ThreatIntelligence[] = [];
  private captureSessions: CaptureSession[] = [];
  private storageKey = 'network_parser_data'; // For non-file data

  private constructor() {
    this.dbPromise = this.initIndexedDB();
    this.loadNonFileDataFromStorage();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn(
          'IndexedDB not supported. File references will not be persisted.',
        );
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error(
          'IndexedDB error:',
          (event.target as IDBOpenDBRequest).error,
        );
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB for File References opened successfully.');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('fileReferences')) {
          db.createObjectStore('fileReferences', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('packets')) {
          db.createObjectStore('packets', { keyPath: 'id' });
        }
        console.log('IndexedDB upgrade complete.');
      };
    });
  }

  // Load/Save non-FileReference data using localStorage
  private loadNonFileDataFromStorage(): void {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // this.packets is now handled by IndexedDB
        // this.files is now handled by IndexedDB
        this.performanceEntries = parsedData.performanceEntries || [];
        this.forensicCases = parsedData.forensicCases || [];
        this.timelineEvents = parsedData.timelineEvents || [];
        this.threatIntelligence = parsedData.threatIntelligence || [];
        this.captureSessions = parsedData.captureSessions || [];
      }
    } catch (error) {
      console.error('Failed to load non-file data from storage:', error);
      // this.packets = [];
      this.performanceEntries = [];
      this.forensicCases = [];
      this.timelineEvents = [];
      this.threatIntelligence = [];
      this.captureSessions = [];
    }
  }

  private saveNonFileDataToStorage(): void {
    try {
      const dataToSave = {
        // packets is now handled by IndexedDB
        // files is now handled by IndexedDB
        performanceEntries: this.performanceEntries,
        forensicCases: this.forensicCases,
        timelineEvents: this.timelineEvents,
        threatIntelligence: this.threatIntelligence,
        captureSessions: this.captureSessions,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save non-file data to storage:', error);
    }
  }

  public async storePacket(packet: ParsedPacket): Promise<string> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return packet.id;
    }

    if (!this.db) {
      console.error('IndexedDB not initialized.');
      return packet.id;
    }

    const transaction = this.db.transaction(
      ['packets', 'fileReferences'],
      'readwrite',
    );
    const packetStore = transaction.objectStore('packets');
    packetStore.add(packet);

    if (packet.fileReferences && packet.fileReferences.length > 0) {
      const fileStore = transaction.objectStore('fileReferences');
      for (const file of packet.fileReferences) {
        const existingFile = await this.getFileById(file.id);
        if (!existingFile) {
          // Only add if it doesn't already exist
          fileStore.add(file);
        }
      }
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });

    this.saveNonFileDataToStorage();
    return packet.id;
  }

  public async storePackets(packets: ParsedPacket[]): Promise<void> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return;
    }

    if (!this.db) {
      console.error('IndexedDB not initialized.');
      return;
    }

    const transaction = this.db.transaction(
      ['packets', 'fileReferences'],
      'readwrite',
    );
    const packetStore = transaction.objectStore('packets');
    const fileStore = transaction.objectStore('fileReferences');

    for (const packet of packets) {
      packetStore.add(packet);
      if (packet.fileReferences && packet.fileReferences.length > 0) {
        for (const file of packet.fileReferences) {
          fileStore.put(file);
        }
      }
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });

    this.saveNonFileDataToStorage();
  }
  public async deletePacket(packetId: string): Promise<void> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return;
    }
    if (!this.db) return;
    const transaction = this.db.transaction(['packets'], 'readwrite');
    const store = transaction.objectStore('packets');
    store.delete(packetId);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });
    this.saveNonFileDataToStorage();
  }

  public async updateFileReference(updatedFile: FileReference): Promise<void> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return;
    }
    if (!this.db) {
      console.error('IndexedDB not initialized.');
      return;
    }
    const transaction = this.db.transaction(['fileReferences'], 'readwrite');
    const store = transaction.objectStore('fileReferences');
    store.put(updatedFile); // put will update if exists, add if not

    // Re-saving packets to ensure their fileReferences array is updated to point to the correct
    // updatedFile reference.
    // Re-saving packets to ensure their fileReferences array is updated to point to the correct
    // updatedFile reference.
    // With IndexedDB, we need to fetch the packet, update it, and put it back.
    // This is expensive if we don't know which packet it belongs to.
    // Fortunately, FileReference has sourcePacketId.
    if (updatedFile.sourcePacketId) {
      const packetTransaction = this.db.transaction(['packets'], 'readwrite');
      const packetStore = packetTransaction.objectStore('packets');
      const packetRequest = packetStore.get(updatedFile.sourcePacketId);

      packetRequest.onsuccess = () => {
        const packet = packetRequest.result as ParsedPacket;
        if (packet && packet.fileReferences) {
          const fileRefIndex = packet.fileReferences.findIndex(
            (f) => f.id === updatedFile.id,
          );
          if (fileRefIndex >= 0) {
            packet.fileReferences[fileRefIndex] = updatedFile;
            packetStore.put(packet);
          }
        }
      };
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });
    // this.saveNonFileDataToStorage(); // No need to save all packets to local storage
  }
  public storePerformanceEntry(entry: PerformanceEntryData): string {
    this.performanceEntries.push(entry);
    this.saveNonFileDataToStorage();
    return entry.id;
  }

  public async getAllPackets(): Promise<ParsedPacket[]> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return [];
    }
    if (!this.db) return [];
    const transaction = this.db.transaction(['packets'], 'readonly');
    const store = transaction.objectStore('packets');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getPacketById(id: string): Promise<ParsedPacket | undefined> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return undefined;
    }
    if (!this.db) return undefined;
    const transaction = this.db.transaction(['packets'], 'readonly');
    const store = transaction.objectStore('packets');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAllFiles(): Promise<FileReference[]> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return [];
    }
    if (!this.db) {
      console.error('IndexedDB not initialized.');
      return [];
    }
    const transaction = this.db.transaction(['fileReferences'], 'readonly');
    const store = transaction.objectStore('fileReferences');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  public async getFileById(id: string): Promise<FileReference | undefined> {
    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
      return undefined;
    }
    if (!this.db) {
      console.error('IndexedDB not initialized.');
      return undefined;
    }
    const transaction = this.db.transaction(['fileReferences'], 'readonly');
    const store = transaction.objectStore('fileReferences');
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  public getAllPerformanceEntries(): PerformanceEntryData[] {
    return [...this.performanceEntries];
  }

  public getPerformanceEntriesByType(
    entryType: string,
  ): PerformanceEntryData[] {
    return this.performanceEntries.filter(
      (entry) => entry.entryType === entryType,
    );
  }

  // Forensic Case Management
  public storeForensicCase(forensicCase: ForensicCase): string {
    this.forensicCases.push(forensicCase);
    this.saveNonFileDataToStorage();
    return forensicCase.id;
  }

  public updateForensicCase(
    caseId: string,
    updates: Partial<ForensicCase>,
  ): void {
    const caseIndex = this.forensicCases.findIndex((c) => c.id === caseId);
    if (caseIndex >= 0) {
      this.forensicCases[caseIndex] = {
        ...this.forensicCases[caseIndex],
        ...updates,
      };
      this.saveNonFileDataToStorage();
    }
  }

  public getAllForensicCases(): ForensicCase[] {
    return [...this.forensicCases];
  }

  public getForensicCaseById(id: string): ForensicCase | undefined {
    return this.forensicCases.find((c) => c.id === id);
  }

  // Timeline Management
  public storeTimelineEvent(event: TimelineEvent): string {
    this.timelineEvents.push(event);
    this.saveNonFileDataToStorage();
    return event.id;
  }

  public getAllTimelineEvents(): TimelineEvent[] {
    return [...this.timelineEvents].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  public getTimelineEventsByDateRange(
    startDate: string,
    endDate: string,
  ): TimelineEvent[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return this.timelineEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  // Threat Intelligence
  public storeThreatIntelligence(threat: ThreatIntelligence): string {
    this.threatIntelligence.push(threat);
    this.saveNonFileDataToStorage();
    return threat.id;
  }

  public getAllThreatIntelligence(): ThreatIntelligence[] {
    return [...this.threatIntelligence];
  }

  public searchThreatIntelligence(value: string): ThreatIntelligence[] {
    return this.threatIntelligence.filter((threat) =>
      threat.value.toLowerCase().includes(value.toLowerCase()),
    );
  }

  // Advanced Search for Forensic Analysis
  public async searchPacketsByForensicCriteria(criteria: {
    sourceIp?: string;
    destIp?: string;
    protocol?: string;
    startTime?: string;
    endTime?: string;
    containsString?: string;
    hasSuspiciousIndicators?: boolean;
    threatLevel?: string;
  }): Promise<ParsedPacket[]> {
    const allPackets = await this.getAllPackets();
    return allPackets.filter((packet) => {
      if (criteria.sourceIp && !packet.sourceIP.includes(criteria.sourceIp))
        return false;
      if (criteria.destIp && !packet.destIP.includes(criteria.destIp))
        return false;
      if (criteria.protocol && packet.protocol !== criteria.protocol)
        return false;
      if (
        criteria.containsString &&
        !new TextDecoder()
          .decode(new Uint8Array(packet.rawData))
          .toLowerCase()
          .includes(criteria.containsString.toLowerCase())
      )
        return false;
      if (
        criteria.hasSuspiciousIndicators &&
        (!packet.suspiciousIndicators ||
          packet.suspiciousIndicators.length === 0)
      )
        return false;

      if (criteria.startTime || criteria.endTime) {
        const packetTime = new Date(packet.timestamp).getTime();
        if (
          criteria.startTime &&
          packetTime < new Date(criteria.startTime).getTime()
        )
          return false;
        if (
          criteria.endTime &&
          packetTime > new Date(criteria.endTime).getTime()
        )
          return false;
      }

      return true;
    });
  }

  public async searchPackets(query: string): Promise<ParsedPacket[]> {
    const lowerQuery = query.toLowerCase();
    const allPackets = await this.getAllPackets();
    return allPackets.filter(
      (packet) =>
        new TextDecoder()
          .decode(new Uint8Array(packet.rawData))
          .toLowerCase()
          .includes(lowerQuery) ||
        packet.sourceIP.includes(lowerQuery) ||
        packet.destIP.includes(lowerQuery) ||
        packet.protocol.toLowerCase().includes(lowerQuery),
    );
  }

  public async clearAllData(): Promise<void> {
    // this.packets = [];
    this.performanceEntries = [];
    this.forensicCases = [];
    this.timelineEvents = [];
    this.threatIntelligence = [];
    this.captureSessions = []; // Also clear capture sessions

    try {
      await this.dbPromise;
    } catch (e) {
      console.error('IndexedDB init failed', e);
    }

    if (this.db) {
      const transaction = this.db.transaction(
        ['packets', 'fileReferences'],
        'readwrite',
      );
      const fileStore = transaction.objectStore('fileReferences');
      fileStore.clear();
      const packetStore = transaction.objectStore('packets');
      packetStore.clear();
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = () => reject(transaction.error);
      });
    }
    this.saveNonFileDataToStorage();
  }

  public clearPerformanceEntries(): void {
    this.performanceEntries = [];
    this.saveNonFileDataToStorage();
  }

  // Capture Session Management
  public storeCaptureSession(session: CaptureSession): void {
    this.captureSessions.push(session);
    this.saveNonFileDataToStorage();
  }

  public getCaptureSession(id: string): CaptureSession | undefined {
    return this.captureSessions.find((session) => session.id === id);
  }
}

export default DatabaseService.getInstance();
