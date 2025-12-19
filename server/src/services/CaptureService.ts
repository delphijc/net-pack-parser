/// <reference path="../types/cap.d.ts" />
import { Cap } from 'cap';
import { CaptureSession } from './CaptureSession';

export interface NetworkInterface {
  name: string;
  addresses: {
    addr?: string;
    netmask?: string;
    broadaddr?: string;
  }[];
  description?: string;
}

export class CaptureService {
  private static activeSessions: Map<string, CaptureSession> = new Map();

  public static getInterfaces(): NetworkInterface[] {
    try {
      const devices = Cap.deviceList();
      return devices.map((device: any) => ({
        name: device.name,
        addresses: device.addresses,
        description: device.description || '',
      }));
    } catch (error) {
      console.error('Error fetching interfaces:', error);
      throw new Error('Failed to retrieve network interfaces');
    }
  }

  public static async startCapture(
    interfaceName: string,
    filter?: string,
    sizeLimit?: number,
  ): Promise<CaptureSession> {
    if (this.activeSessions.has(interfaceName)) {
      throw new Error(`Capture already running on ${interfaceName}`);
    }

    const session = new CaptureSession(interfaceName);
    // The original start method had promiscuous: boolean = false.
    // Since the new signature removes it, we'll assume it's handled internally by CaptureSession or defaults to false.
    // The original filter and sizeLimit had default values, now they are optional.
    // We pass them as they are, letting CaptureSession handle undefined values if necessary.
    session.start(false, filter || '', sizeLimit || 0); // Assuming promiscuous defaults to false
    this.activeSessions.set(interfaceName, session);

    return session;
  }

  public static stopCapture(interfaceName: string): {
    packetCount: number;
    output: string;
  } {
    const session = this.activeSessions.get(interfaceName);
    if (!session) {
      throw new Error(`No active capture on ${interfaceName}`);
    }

    session.stop();
    this.activeSessions.delete(interfaceName);

    return {
      packetCount: session.packetCount,
      output: session.outputFilePath,
    };
  }

  public static pauseCapture(interfaceName: string): void {
    const session = this.activeSessions.get(interfaceName);
    if (!session) {
      throw new Error(`No active capture on ${interfaceName}`);
    }
    session.pause();
  }

  public static resumeCapture(interfaceName: string): void {
    const session = this.activeSessions.get(interfaceName);
    if (!session) {
      throw new Error(`No active capture on ${interfaceName}`);
    }
    session.resume();
  }

  public static getCaptureStats(interfaceName: string): any {
    const session = this.activeSessions.get(interfaceName);
    if (!session) {
      throw new Error(`No active capture on ${interfaceName}`);
    }
    return session.getStats();
  }

  public static getSessions(): any[] {
    const sessions: any[] = [];
    this.activeSessions.forEach((session) => {
      sessions.push({
        interface: session.interfaceName,
        ...session.getStats(),
      });
    });
    return sessions;
  }
}
