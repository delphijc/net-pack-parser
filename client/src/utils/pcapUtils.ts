/**
 * Interface representing the Global Header of a PCAP file.
 */
export interface PcapGlobalHeader {
  magicNumber: number;
  majorVersion: number;
  minorVersion: number;
  thiszone: number;
  sigfigs: number;
  snaplen: number;
  network: number;
}

/**
 * Interface representing a Packet Header in a PCAP file.
 */
export interface PcapPacketHeader {
  tsSec: number;
  tsUsec: number;
  inclLen: number;
  origLen: number;
}

/**
 * Interface representing a fully parsed PCAP packet.
 */
export interface PcapPacket {
  header: PcapPacketHeader;
  data: Uint8Array;
}

/**
 * Parses a PCAP file from an ArrayBuffer.
 *
 * @param buffer The ArrayBuffer containing the PCAP data.
 * @returns An object containing the global header and an array of parsed packets.
 * @throws Error if the magic number is invalid or if the file is truncated.
 */
export function parsePcap(buffer: ArrayBuffer): {
  globalHeader: PcapGlobalHeader;
  packets: PcapPacket[];
} {
  const dataView = new DataView(buffer);
  let offset = 0;

  // 1. Global Header (24 bytes)
  if (dataView.byteLength < 24) {
    throw new Error('File too short to contain PCAP global header');
  }

  const magicNumberLE = dataView.getUint32(offset, true);
  const magicNumberBE = dataView.getUint32(offset, false);
  let littleEndian = true;

  // Magic number for microseconds: 0xa1b2c3d4
  // Magic number for nanoseconds: 0xa1b23c4d (not fully supported here, treated same basic structure)
  if (magicNumberLE === 0xa1b2c3d4 || magicNumberLE === 0xa1b23c4d) {
    littleEndian = true;
  } else if (magicNumberBE === 0xa1b2c3d4 || magicNumberBE === 0xa1b23c4d) {
    littleEndian = false;
  } else {
    throw new Error(
      `Invalid PCAP Magic Number: ${magicNumberLE.toString(16)} (LE) / ${magicNumberBE.toString(16)} (BE)`,
    );
  }

  const magicNumber = littleEndian ? magicNumberLE : magicNumberBE;
  offset += 4;

  const majorVersion = dataView.getUint16(offset, littleEndian);
  offset += 2;
  const minorVersion = dataView.getUint16(offset, littleEndian);
  offset += 2;
  const thiszone = dataView.getInt32(offset, littleEndian);
  offset += 4;
  const sigfigs = dataView.getUint32(offset, littleEndian);
  offset += 4;
  const snaplen = dataView.getUint32(offset, littleEndian);
  offset += 4;
  const network = dataView.getUint32(offset, littleEndian);
  offset += 4;

  const globalHeader: PcapGlobalHeader = {
    magicNumber,
    majorVersion,
    minorVersion,
    thiszone,
    sigfigs,
    snaplen,
    network,
  };

  // 2. Packets
  const packets: PcapPacket[] = [];

  while (offset < dataView.byteLength) {
    // Check if we have enough bytes for a packet header (16 bytes)
    if (offset + 16 > dataView.byteLength) {
      console.warn(
        'Unexpected end of file in packet header (truncated)',
        offset,
        dataView.byteLength,
      );
      break;
    }

    const tsSec = dataView.getUint32(offset, littleEndian);
    offset += 4;
    const tsUsec = dataView.getUint32(offset, littleEndian);
    offset += 4;
    const inclLen = dataView.getUint32(offset, littleEndian);
    offset += 4;
    const origLen = dataView.getUint32(offset, littleEndian);
    offset += 4;

    const header: PcapPacketHeader = {
      tsSec,
      tsUsec,
      inclLen,
      origLen,
    };

    // Check if we have enough bytes for the packet body
    if (offset + inclLen > dataView.byteLength) {
      console.warn(
        'Unexpected end of file in packet body (truncated)',
        offset,
        inclLen,
        dataView.byteLength,
      );
      break;
    }

    // Create a copy of the packet data
    const packetData = new Uint8Array(buffer.slice(offset, offset + inclLen));
    offset += inclLen;

    packets.push({
      header,
      data: packetData,
    });
  }

  return { globalHeader, packets };
}
