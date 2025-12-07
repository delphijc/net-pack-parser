// client/src/components/FilesTab.tsx

import React, { useEffect, useState } from 'react';
import type { FileReference, ParsedPacket } from '../types';
import DatabaseService from '../services/database';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuditLogger } from '@/hooks/useAuditLogger';

interface FilesTabProps {
  packet: ParsedPacket; // The packet that might contain file references
}

const FilesTab: React.FC<FilesTabProps> = ({ packet }) => {
  const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
  const databaseService = DatabaseService;
  const { logAction } = useAuditLogger();

  useEffect(() => {
    const fetchFiles = async () => {
      if (packet && packet.fileReferences) {
        const files = await Promise.all(
          packet.fileReferences.map(async (fileRef) => {
            // Fetch full file data from IndexedDB
            const fullFile = await databaseService.getFileById(fileRef.id);
            return fullFile || fileRef; // Return full file or existing reference if not found
          }),
        );
        setFileReferences(
          files.filter((file) => file.data && file.data.size > 0),
        ); // Only show files with actual data
      }
    };

    fetchFiles();
  }, [packet, databaseService]);

  const handleDownload = async (file: FileReference) => {
    if (file.data) {
      const url = URL.createObjectURL(file.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Integrate Chain of Custody logging (AC 5)
      logAction('DOWNLOAD', `File Downloaded: ${file.filename}`, {
        filename: file.filename,
        fileSize: file.size,
        mimeType: file.mimeType,
        sha256Hash: file.sha256Hash,
        userAgent: navigator.userAgent,
      });

      console.log(
        `Downloaded file: ${file.filename}, Hash: ${file.sha256Hash}`,
      );
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (!fileReferences || fileReferences.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No file references detected for this packet.
      </div>
    );
  }

  return (
    <div className="p-4">
      <Table>
        <TableCaption>Detected File References</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>MIME Type</TableHead>
            <TableHead>Source IP</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>SHA-256 Hash</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fileReferences.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">{file.filename}</TableCell>
              <TableCell>{formatBytes(file.size)}</TableCell>
              <TableCell>{file.mimeType}</TableCell>
              <TableCell>{packet.sourceIP}</TableCell>{' '}
              {/* Assuming source IP of the packet is the source of the file */}
              <TableCell>
                {new Date(packet.timestamp).toLocaleString()}
              </TableCell>{' '}
              {/* Assuming timestamp of the packet */}
              <TableCell className="font-mono text-xs">
                {file.sha256Hash || 'N/A'}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={!file.data}
                >
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FilesTab;
