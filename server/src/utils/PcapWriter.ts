import fs from 'fs';

export class PcapWriter {
  private stream: fs.WriteStream;

  constructor(filePath: string, linkType: number) {
    this.stream = fs.createWriteStream(filePath);
    this.writeGlobalHeader(linkType);
  }

  private writeGlobalHeader(linkType: number) {
    const buffer = Buffer.alloc(24);

    // Magic Number (0xa1b2c3d4)
    buffer.writeUInt32LE(0xa1b2c3d4, 0);
    // Major Version (2)
    buffer.writeUInt16LE(2, 4);
    // Minor Version (4)
    buffer.writeUInt16LE(4, 6);
    // This zone (0)
    buffer.writeUInt32LE(0, 8);
    // Sig figs (0)
    buffer.writeUInt32LE(0, 12);
    // Snaplen (65535)
    buffer.writeUInt32LE(65535, 16);
    // Network (Link Layer Type)
    buffer.writeUInt32LE(linkType, 20);

    this.stream.write(buffer);
  }

  public writePacket(
    packetData: Buffer,
    bytesCaptured: number = packetData.length,
    originalLength: number = packetData.length,
  ) {
    const buffer = Buffer.alloc(16);
    const now = Date.now();
    const sec = Math.floor(now / 1000);
    const usec = (now % 1000) * 1000;

    // Timestamp seconds
    buffer.writeUInt32LE(sec, 0);
    // Timestamp microseconds
    buffer.writeUInt32LE(usec, 4);
    // Included length (bytes saved)
    buffer.writeUInt32LE(bytesCaptured, 8);
    // Original length (actual length on wire)
    buffer.writeUInt32LE(originalLength, 12);

    this.stream.write(buffer);
    this.stream.write(packetData);
  }

  public close() {
    this.stream.end();
  }
}
