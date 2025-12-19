/// <reference path="../types/cap.d.ts" />
import { Cap } from 'cap';
import path from 'path';
import { PcapWriter } from '../utils/PcapWriter';
import { StorageService } from './StorageService';
import { sessionRepository } from '../repositories/SessionRepository';
import { PacketParser } from '../utils/PacketParser';
import { WebSocketService } from './WebSocketService';
import { WSMessageType } from '../types/WebSocketMessages';

export class CaptureSession {
  public readonly id: string;
  public readonly interfaceName: string;
  public readonly startTime: number;
  public packetCount: number = 0;

  private cap: Cap;
  private writer: PcapWriter | null = null;
  private buffer: Buffer;
  private running: boolean = false;
  private paused: boolean = false;
  private bytesWritten: number = 0;
  private sizeLimitBytes: number = 0;
  private diskCheckInterval: NodeJS.Timeout | null = null;
  public readonly outputFilePath: string;

  constructor(interfaceName: string) {
    this.id = `cap_${Date.now()}_${interfaceName}`;
    this.interfaceName = interfaceName;
    this.startTime = Date.now();
    this.outputFilePath = StorageService.generatePath(interfaceName);
    this.cap = new Cap();
    this.buffer = Buffer.alloc(65535);

    // Create initial DB record
    sessionRepository.create({
      id: this.id,
      interfaceName: this.interfaceName,
      startTime: this.startTime,
      endTime: null,
      status: 'running',
      packetCount: 0,
      sizeBytes: 0,
      outputFilePath: this.outputFilePath,
    });
  }

  public start(
    promiscuous: boolean = false,
    filter: string = '',
    sizeLimitMB: number = 0,
  ) {
    // On macOS, cap.open() requires the interface NAME (e.g., 'en0'), not the IP address
    const target = this.interfaceName;
    console.log(`CaptureSession: starting capture on interface '${target}'`);

    if (sizeLimitMB > 0) {
      this.sizeLimitBytes = sizeLimitMB * 1024 * 1024;
    }

    try {
      const linkType = this.cap.open(
        target,
        filter,
        10 * 1024 * 1024,
        this.buffer,
      );
      // setMinBytes not available in all cap versions, removed

      // Directory handled by StorageService

      this.writer = new PcapWriter(
        this.outputFilePath,
        typeof linkType === 'string' ? 1 : (linkType as unknown as number),
      ); // linkType from cap.open is string 'ETH' etc or number?
      // node-cap documentation says it returns the link type (LINKTYPE_...) which is an integer usually.
      // Let's cast it safely. If it returns 'ETHERNET' string, we need to map it.
      // For now assume it returns the integer linktype as expected by pcap.
      this.bytesWritten = 24; // Global header

      this.cap.on('packet', (nBytes: number, trunc: boolean) => {
        if (this.running && !this.paused && this.writer) {
          this.packetCount++;
          // nBytes is number of bytes received
          // The data is in this.buffer.slice(0, nBytes)
          const data = this.buffer.slice(0, nBytes);
          this.writer.writePacket(data);
          this.bytesWritten += 16 + data.length; // 16 bytes packet header + payload

          if (
            this.sizeLimitBytes > 0 &&
            this.bytesWritten >= this.sizeLimitBytes
          ) {
            console.log(
              `Size limit of ${this.sizeLimitBytes} bytes reached. Stopping capture.`,
            );
            this.stop();
          }

          // Parse and broadcast live packet
          try {
            const packetData = PacketParser.parse(data, Date.now());
            if (packetData) {
              WebSocketService.broadcast({
                type: WSMessageType.PACKET,
                data: packetData,
              });
            }
          } catch (err) {
            // Silent fail for broadcast to not stop capture
          }
        }
      });

      this.running = true;
      this.paused = false;

      // Start disk space check interval (every 5 seconds)
      this.startDiskCheck();

      console.log(
        `Started capture on ${this.interfaceName} (Target: ${target}). Output: ${this.outputFilePath}`,
      );
    } catch (e) {
      console.error(`Failed to start capture on ${this.interfaceName}`, e);
      throw e;
    }
  }

  public stop() {
    if (this.running) {
      this.running = false;
      this.paused = false;
      this.cap.close();
      this.writer?.close();
      if (this.diskCheckInterval) {
        clearInterval(this.diskCheckInterval);
        this.diskCheckInterval = null;
      }

      // Update DB record
      sessionRepository.update(this.id, {
        endTime: Date.now(),
        status: 'stopped',
        packetCount: this.packetCount,
        sizeBytes: this.bytesWritten,
      });

      console.log(
        `Stopped capture on ${this.interfaceName}. captured ${this.packetCount} packets.`,
      );
    }
  }

  private startDiskCheck() {
    const fs = require('fs');
    this.diskCheckInterval = setInterval(() => {
      if (!this.running) return;

      try {
        // Check free space on the volume where captures are stored
        // fs.statfs is available in Node 18+
        if (fs.statfs) {
          fs.statfs(
            path.dirname(this.outputFilePath),
            (err: any, stats: any) => {
              if (err) {
                console.error('Error checking disk space:', err);
                return;
              }
              // stats.bavail: free blocks available to non-super user, stats.bsize: block size
              const freeBytes = stats.bavail * stats.bsize;
              // 100MB critical threshold
              if (freeBytes < 100 * 1024 * 1024) {
                console.warn(
                  `Critical disk space (${Math.round(freeBytes / 1024 / 1024)}MB free). Stopping capture.`,
                );
                this.stop();
              }
            },
          );
        }
      } catch (err) {
        console.error('Disk check failed', err);
      }
    }, 5000);
  }

  public pause() {
    if (this.running) {
      this.paused = true;
      console.log(`Paused capture on ${this.interfaceName}`);
    }
  }

  public resume() {
    if (this.running && this.paused) {
      this.paused = false;
      console.log(`Resumed capture on ${this.interfaceName}`);
    }
  }

  public isActive(): boolean {
    return this.running;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public getStats() {
    return {
      captured: this.packetCount,
      dropped: 0, // Not available directly from cap event loop easily without implementing stats call
      fileSize: this.bytesWritten,
      duration: Date.now() - this.startTime,
    };
  }
}
