import { ParsedPacket, FileReference, PerformanceEntryData } from '../types';
import { ForensicCase, TimelineEvent, ThreatIntelligence, SuspiciousIndicator } from '../types';

class DatabaseService {
  private static instance: DatabaseService;
  private packets: ParsedPacket[] = [];
  private files: FileReference[] = [];
  private performanceEntries: PerformanceEntryData[] = [];
  private forensicCases: ForensicCase[] = [];
  private timelineEvents: TimelineEvent[] = [];
  private threatIntelligence: ThreatIntelligence[] = [];
  private storageKey = 'network_parser_data';
  
  private constructor() {
    this.loadFromStorage();
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  private loadFromStorage(): void {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.packets = parsedData.packets || [];
        this.files = parsedData.files || [];
        this.performanceEntries = parsedData.performanceEntries || [];
        this.forensicCases = parsedData.forensicCases || [];
        this.timelineEvents = parsedData.timelineEvents || [];
        this.threatIntelligence = parsedData.threatIntelligence || [];
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
      this.packets = [];
      this.files = [];
      this.performanceEntries = [];
      this.forensicCases = [];
      this.timelineEvents = [];
      this.threatIntelligence = [];
    }
  }
  
  private saveToStorage(): void {
    try {
      const dataToSave = {
        packets: this.packets,
        files: this.files,
        performanceEntries: this.performanceEntries,
        forensicCases: this.forensicCases,
        timelineEvents: this.timelineEvents,
        threatIntelligence: this.threatIntelligence
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data to storage:', error);
    }
  }
  
  public storePacket(packet: ParsedPacket): string {
    this.packets.push(packet);
    
    packet.fileReferences.forEach(file => {
      if (!this.files.some(f => f.id === file.id)) {
        this.files.push(file);
      }
    });
    
    this.saveToStorage();
    return packet.id;
  }
  
  public deletePacket(packetId: string): void {
    const packet = this.packets.find(p => p.id === packetId);
    if (!packet) return;

    // Remove file references if they're not used by other packets
    packet.fileReferences.forEach(fileRef => {
      const isUsedElsewhere = this.packets.some(p => 
        p.id !== packetId && p.fileReferences.some(f => f.id === fileRef.id)
      );
      
      if (!isUsedElsewhere) {
        this.files = this.files.filter(f => f.id !== fileRef.id);
      }
    });

    // Remove the packet
    this.packets = this.packets.filter(p => p.id !== packetId);
    this.saveToStorage();
  }
  
  public updateFileReference(updatedFile: FileReference): void {
    const fileIndex = this.files.findIndex(f => f.id === updatedFile.id);
    if (fileIndex >= 0) {
      this.files[fileIndex] = updatedFile;
    }
    
    this.packets.forEach((packet, pIndex) => {
      const fileRefIndex = packet.fileReferences.findIndex(f => f.id === updatedFile.id);
      if (fileRefIndex >= 0) {
        this.packets[pIndex].fileReferences[fileRefIndex] = updatedFile;
      }
    });
    
    this.saveToStorage();
  }
  
  public storePerformanceEntry(entry: PerformanceEntryData): string {
    this.performanceEntries.push(entry);
    this.saveToStorage();
    return entry.id;
  }
  
  public getAllPackets(): ParsedPacket[] {
    return [...this.packets];
  }
  
  public getPacketById(id: string): ParsedPacket | undefined {
    return this.packets.find(p => p.id === id);
  }
  
  public getAllFiles(): FileReference[] {
    return [...this.files];
  }
  
  public getFileById(id: string): FileReference | undefined {
    return this.files.find(f => f.id === id);
  }
  
  public getAllPerformanceEntries(): PerformanceEntryData[] {
    return [...this.performanceEntries];
  }
  
  public getPerformanceEntriesByType(entryType: string): PerformanceEntryData[] {
    return this.performanceEntries.filter(entry => entry.entryType === entryType);
  }
  
  // Forensic Case Management
  public storeForensicCase(forensicCase: ForensicCase): string {
    this.forensicCases.push(forensicCase);
    this.saveToStorage();
    return forensicCase.id;
  }
  
  public updateForensicCase(caseId: string, updates: Partial<ForensicCase>): void {
    const caseIndex = this.forensicCases.findIndex(c => c.id === caseId);
    if (caseIndex >= 0) {
      this.forensicCases[caseIndex] = { ...this.forensicCases[caseIndex], ...updates };
      this.saveToStorage();
    }
  }
  
  public getAllForensicCases(): ForensicCase[] {
    return [...this.forensicCases];
  }
  
  public getForensicCaseById(id: string): ForensicCase | undefined {
    return this.forensicCases.find(c => c.id === id);
  }
  
  // Timeline Management
  public storeTimelineEvent(event: TimelineEvent): string {
    this.timelineEvents.push(event);
    this.saveToStorage();
    return event.id;
  }
  
  public getAllTimelineEvents(): TimelineEvent[] {
    return [...this.timelineEvents].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
  
  public getTimelineEventsByDateRange(startDate: string, endDate: string): TimelineEvent[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.timelineEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }
  
  // Threat Intelligence
  public storeThreatIntelligence(threat: ThreatIntelligence): string {
    this.threatIntelligence.push(threat);
    this.saveToStorage();
    return threat.id;
  }
  
  public getAllThreatIntelligence(): ThreatIntelligence[] {
    return [...this.threatIntelligence];
  }
  
  public searchThreatIntelligence(value: string): ThreatIntelligence[] {
    return this.threatIntelligence.filter(threat => 
      threat.value.toLowerCase().includes(value.toLowerCase())
    );
  }
  
  // Advanced Search for Forensic Analysis
  public searchPacketsByForensicCriteria(criteria: {
    sourceIp?: string;
    destIp?: string;
    protocol?: string;
    startTime?: string;
    endTime?: string;
    containsString?: string;
    hasSuspiciousIndicators?: boolean;
    threatLevel?: string;
  }): ParsedPacket[] {
    return this.packets.filter(packet => {
      if (criteria.sourceIp && !packet.source.includes(criteria.sourceIp)) return false;
      if (criteria.destIp && !packet.destination.includes(criteria.destIp)) return false;
      if (criteria.protocol && packet.protocol !== criteria.protocol) return false;
      if (criteria.containsString && !packet.rawData.toLowerCase().includes(criteria.containsString.toLowerCase())) return false;
      if (criteria.hasSuspiciousIndicators && (!packet.suspiciousIndicators || packet.suspiciousIndicators.length === 0)) return false;
      
      if (criteria.startTime || criteria.endTime) {
        const packetTime = new Date(packet.timestamp).getTime();
        if (criteria.startTime && packetTime < new Date(criteria.startTime).getTime()) return false;
        if (criteria.endTime && packetTime > new Date(criteria.endTime).getTime()) return false;
      }
      
      return true;
    });
  }
  
  public searchPackets(query: string): ParsedPacket[] {
    const lowerQuery = query.toLowerCase();
    return this.packets.filter(packet => 
      packet.rawData.toLowerCase().includes(lowerQuery) ||
      packet.source.includes(lowerQuery) ||
      packet.destination.includes(lowerQuery) ||
      packet.protocol.toLowerCase().includes(lowerQuery)
    );
  }
  
  public clearAllData(): void {
    this.packets = [];
    this.files = [];
    this.performanceEntries = [];
    this.forensicCases = [];
    this.timelineEvents = [];
    this.threatIntelligence = [];
    this.saveToStorage();
  }
  
  public clearPerformanceEntries(): void {
    this.performanceEntries = [];
    this.saveToStorage();
  }
}

export default DatabaseService.getInstance();