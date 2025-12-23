// client/src/types/fileReference.ts

/**
 * Represents a file detected and extracted from network traffic.
 */
export interface FileReference {
  /** Unique identifier for the file reference. */
  id: string;
  /** Name of the file. */
  filename: string;
  /** Size of the file in bytes. */
  size: number;
  /** MIME type of the file (e.g., 'image/png', 'application/octet-stream'). */
  mimeType: string;
  /** ID of the packet from which this file reference was initially detected. */
  sourcePacketId: string;
  /** The actual binary data of the reconstructed file. Optional if using offset extraction. */
  data?: Blob;
  /** Offset in the packet payload where file data starts. */
  dataOffset?: number;
  /** SHA-256 hash of the file data for integrity verification. */
  sha256Hash: string;
  /** Optional: MD5 hash of the file data. */
  md5Hash?: string;
  /** Optional: Port used for FTP data transfer. */
  ftpDataPort?: number;
  /** Optional: Type of FTP transfer. */
  ftpTransferType?: 'STOR' | 'RETR';
  /** Optional: Magic number/signature detected. */
  magicNumber?: string;
}
