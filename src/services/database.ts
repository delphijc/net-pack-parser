import { ParsedPacket, FileReference, PerformanceEntryData } from '../types';

class DatabaseService {
  private static instance: DatabaseService;
  private packets: ParsedPacket[] = [];
  private files: FileReference[] = [];
  private performanceEntries: PerformanceEntryData[] = [];
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
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
      this.packets = [];
      this.files = [];
      this.performanceEntries = [];
    }
  }
  
  private saveToStorage(): void {
    try {
      const dataToSave = {
        packets: this.packets,
        files: this.files,
        performanceEntries: this.performanceEntries
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
    this.saveToStorage();
  }
  
  public clearPerformanceEntries(): void {
    this.performanceEntries = [];
    this.saveToStorage();
  }
}

export default DatabaseService.getInstance();