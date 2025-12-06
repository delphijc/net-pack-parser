import React, { useState, useRef } from 'react';
import { parseNetworkData, downloadFile } from '../../services/pcapParser';
import {
  startNetworkCapture,
  stopNetworkCapture,
} from '../../services/networkCapture';
import database from '../../services/database';
import type { ParsedPacket } from '../../types';
import { generateSha256Hash, generateMd5Hash } from '../../utils/hashGenerator';
import FileInfo from '../FileInfo'; // Import the new FileInfo component
import chainOfCustodyDb from '../../services/chainOfCustodyDb';
import { v4 as uuidv4 } from 'uuid';
import type { FileChainOfCustodyEvent } from '../../types';
import ChainOfCustodyLog from '../ChainOfCustodyLog';
import {
  Terminal,
  StopCircle,
  Wifi,
  Upload,
  Play,
  Loader2,
  Send,
  AlertTriangle,
} from 'lucide-react';

interface PcapUploadProps {
  onParsingStatusChange?: (isParsing: boolean) => void;
}

const PcapUpload: React.FC<PcapUploadProps> = ({ onParsingStatusChange }) => {
  const [inputData, setInputData] = useState('');
  const [parsing, setParsing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedData, setCapturedData] = useState<ParsedPacket[]>([]);
  const [lastParsedPacket, setLastParsedPacket] = useState<ParsedPacket | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for file info
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [uploadedFileSha256, setUploadedFileSha256] = useState<string | null>(
    null,
  );
  const [uploadedFileMd5, setUploadedFileMd5] = useState<string | null>(null);
  const [uploadedFileBuffer, setUploadedFileBuffer] =
    useState<ArrayBuffer | null>(null);

  const handleVerifyIntegrity = async (): Promise<{
    sha256Match: boolean;
    md5Match: boolean;
  }> => {
    if (!uploadedFileBuffer || !uploadedFileSha256 || !uploadedFileMd5) {
      throw new Error('No file uploaded or hashes available for verification.');
    }

    const recalculatedSha256 = await generateSha256Hash(uploadedFileBuffer);
    const recalculatedMd5 = await generateMd5Hash(uploadedFileBuffer);

    return {
      sha256Match: recalculatedSha256 === uploadedFileSha256,
      md5Match: recalculatedMd5 === uploadedFileMd5,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputData.trim()) {
      setErrorMessage('Please enter some data to parse');
      return;
    }

    try {
      setParsing(true);
      onParsingStatusChange?.(true);
      setErrorMessage('');

      // Parse the input data
      const parsedPackets = await parseNetworkData(inputData);

      if (parsedPackets.length === 0) {
        setErrorMessage('No valid packets found in input data.');
        return;
      }

      // Store the parsed packets in the database
      database.storePackets(parsedPackets);

      // Process file downloads for all packets
      const filePromises = parsedPackets.flatMap((packet) =>
        packet.fileReferences.map(async (fileRef) => {
          const updatedFile = await downloadFile(fileRef);
          database.updateFileReference(updatedFile);
          return updatedFile;
        }),
      );

      // Wait for all file downloads to complete
      await Promise.all(filePromises);

      await database.storePackets(parsedPackets);
      // Ensure DB transaction completes before proceeding

      // Set the last parsed packet (use the last one for display)
      setLastParsedPacket(parsedPackets[parsedPackets.length - 1]);

      // Clear the input data
      setInputData('');
      // setCapturedData([]); // This is fine
    } catch (error) {
      console.error('Error parsing data:', error);
      setErrorMessage('Failed to parse data. Please try again.');
    } finally {
      setParsing(false);
      onParsingStatusChange?.(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsing(true);
      onParsingStatusChange?.(true);
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      setUploadedFileBuffer(buffer);

      // Generate hashes
      const sha256Hash = await generateSha256Hash(buffer);
      const md5Hash = await generateMd5Hash(buffer);

      // Store file info and hashes in state
      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);
      setUploadedFileSha256(sha256Hash);
      setUploadedFileMd5(md5Hash);

      // Create and store Chain of Custody log entry
      const cocEvent: FileChainOfCustodyEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action: 'File Uploaded',
        filename: file.name,
        fileSize: file.size,
        sha256Hash: sha256Hash,
        md5Hash: md5Hash,
        userAgent: navigator.userAgent,
      };
      await chainOfCustodyDb.addFileChainOfCustodyEvent(cocEvent);

      const parsedPackets = await parseNetworkData(buffer);

      if (parsedPackets.length === 0) {
        setErrorMessage('No valid packets found in PCAP file.');
        return;
      }

      await database.storePackets(parsedPackets);
      // Ensure DB transaction completes before proceeding
      // (storePackets resolves after transaction oncomplete)
      // Note: parsedPackets can be large, but IndexedDB handles it.
      // The crash might have been due to main thread blocking from worker messages.
      setLastParsedPacket(parsedPackets[parsedPackets.length - 1]);
      setInputData('');
      setCapturedData([]);
    } catch (error) {
      console.error('Error parsing PCAP file:', error);
      setErrorMessage(
        "Failed to parse PCAP file. Please ensure it's a valid capture file.",
      );
    } finally {
      setParsing(false);
      onParsingStatusChange?.(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCaptureToggle = async () => {
    try {
      if (capturing) {
        // Stop the capture and load captured data into the parser content viewer
        const packets = stopNetworkCapture();
        setCapturing(false);

        // Update captured data in the UI
        if (packets.length > 0) {
          setCapturedData(packets);

          // Load the first packet's rawData into the input field (as string for display)
          if (packets[0].rawData) {
            setInputData(
              new TextDecoder().decode(new Uint8Array(packets[0].rawData)),
            );
          }
        } else {
          setErrorMessage(
            'No network traffic was captured. Try visiting different websites while capturing.',
          );
        }
      } else {
        setErrorMessage('');
        setCapturedData([]);

        // Start network capture with a callback that updates the UI in real-time
        await startNetworkCapture((packet) => {
          setCapturedData((prev) => {
            // Only add the packet if it's not already in the array
            if (!prev.some((p) => p.id === packet.id)) {
              return [...prev, packet];
            }
            return prev;
          });
        });

        setCapturing(true);
      }
    } catch (error) {
      console.error('Error with network capture:', error);
      setErrorMessage(
        'Failed to start network capture. Please ensure you have the necessary permissions.',
      );
      setCapturing(false);
    }
  };

  const handleParseCapture = () => {
    if (capturedData.length === 0) {
      setErrorMessage('No captured data to parse');
      return;
    }

    // Store all captured packets in the database
    database.storePackets(capturedData);

    // Set the last packet as the most recently parsed
    setLastParsedPacket(capturedData[capturedData.length - 1]);

    // Clear the captured data
    setCapturedData([]);
  };

  const sampleData = [
    'GET /api/users HTTP/1.1\nHost: example.com\nUser-Agent: Mozilla/5.0\nAccept: */*\n\nid=123&name=John',
    'HTTP/1.1 200 OK\nContent-Type: application/json\nServer: nginx\n\n{"data": {"url": "https://example.com/files/document.pdf", "items": [1, 2, 3]}}',
    'From: user@example.com\nTo: admin@example.com\nSubject: Weekly Report\n\nPlease find the attached report at https://example.com/reports/weekly.xlsx',
  ];

  const loadSampleData = (index: number) => {
    setInputData(sampleData[index]);
  };

  const handleViewPacket = (packet: ParsedPacket) => {
    // Load the raw data into the input field as string
    setInputData(new TextDecoder().decode(new Uint8Array(packet.rawData)));
  };

  return (
    <div className="p-6 h-full overflow-y-auto animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        Network Traffic Parser
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-card border border-white/10 rounded-lg shadow-sm p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Terminal size={20} className="text-primary mr-2" />
                <h2 className="text-lg font-semibold text-foreground">
                  Parse Network Data
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCaptureToggle}
                  className={`px-4 py-2 rounded-md text-sm flex items-center transition-colors font-medium ${capturing
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                >
                  {capturing ? (
                    <>
                      <StopCircle size={16} className="mr-2" />
                      Stop Capture
                    </>
                  ) : (
                    <>
                      <Wifi size={16} className="mr-2" />
                      Start Capture
                    </>
                  )}
                </button>
                <input
                  type="file"
                  accept=".pcap,.cap"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm flex items-center text-secondary-foreground transition-colors"
                >
                  <Upload size={16} className="mr-2" />
                  Upload PCAP
                </button>
              </div>
            </div>

            {capturedData.length > 0 && (
              <div className="mb-4 bg-black/40 border border-white/5 p-4 rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Captured Packets ({capturedData.length})
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleParseCapture}
                      className="px-3 py-1.5 bg-primary hover:bg-primary/90 rounded text-sm flex items-center text-primary-foreground transition-colors"
                    >
                      <Play size={14} className="mr-1.5" />
                      Parse All
                    </button>
                    {capturing && (
                      <div className="flex items-center text-xs text-emerald-500">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                        Capturing...
                      </div>
                    )}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {capturedData.map((packet, index) => (
                    <div
                      key={packet.id}
                      className="mb-1 py-1 px-2 hover:bg-white/5 rounded cursor-pointer flex justify-between items-center transition-colors"
                      onClick={() => handleViewPacket(packet)}
                    >
                      <div className="text-sm truncate text-foreground/80 font-mono">
                        {index + 1}. {packet.protocol} - {packet.destIP}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {capturing && capturedData.length === 0 && (
              <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-md p-3 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <p className="text-sm text-blue-400">
                  Waiting for network traffic... Open websites or perform
                  network operations to capture traffic.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="inputData"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Enter Network Data to Parse
                </label>
                <textarea
                  id="inputData"
                  className="w-full h-48 px-3 py-2 text-sm bg-black/40 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground placeholder:text-muted-foreground/50"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Paste network traffic data here (HTTP headers, email content, etc.)"
                ></textarea>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start">
                  <AlertTriangle
                    size={16}
                    className="text-destructive mr-2 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-sm text-destructive-foreground">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between">
                <div className="mb-2 md:mb-0 space-x-3">
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                    onClick={() => loadSampleData(0)}
                  >
                    Load HTTP Request
                  </button>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                    onClick={() => loadSampleData(1)}
                  >
                    Load HTTP Response
                  </button>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                    onClick={() => loadSampleData(2)}
                  >
                    Load Email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={parsing}
                  className={`px-4 py-2 rounded-md text-white font-medium flex items-center transition-colors ${parsing
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90'
                    }`}
                >
                  {parsing ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Parse Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-card border border-white/10 rounded-lg shadow-sm p-6 h-full backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Quick Help
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-primary mb-1">
                  What data can I parse?
                </h3>
                <p className="text-muted-foreground">
                  You can paste any network traffic data including HTTP
                  requests/responses, emails, JSON payloads, and more. You can
                  also upload PCAP files from Wireshark or use direct network
                  capture.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-primary mb-1">
                  How does it work?
                </h3>
                <p className="text-muted-foreground">
                  The parser extracts tokens (non-alphanumeric characters) and
                  string content, identifies sections, and detects file
                  references in URLs. For PCAP files, it analyzes packet headers
                  and payload data.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-primary mb-1">
                  Where is data stored?
                </h3>
                <p className="text-muted-foreground">
                  All parsed data is stored locally in your browser. Nothing is
                  sent to external servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lastParsedPacket && (
        <div className="mt-6 bg-card border border-white/10 rounded-lg shadow-sm p-6 border-l-4 border-l-emerald-500 animate-fadeIn backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-foreground">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Successfully Parsed Packet
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Packet Information
              </h3>
              <div className="bg-black/40 border border-white/5 p-3 rounded">
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">ID:</span>{' '}
                  {lastParsedPacket.id}
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Protocol:</span>{' '}
                  {lastParsedPacket.protocol}
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Source:</span>{' '}
                  {lastParsedPacket.sourceIP}
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Destination:</span>{' '}
                  {lastParsedPacket.destIP}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Extracted Data
              </h3>
              <div className="bg-black/40 border border-white/5 p-3 rounded">
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Tokens:</span>{' '}
                  {
                    lastParsedPacket.tokens.filter((t) => t.type === 'token')
                      .length
                  }
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Strings:</span>{' '}
                  {
                    lastParsedPacket.tokens.filter((t) => t.type === 'string')
                      .length
                  }
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Sections:</span>{' '}
                  {lastParsedPacket.sections.length}
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">
                    File References:
                  </span>{' '}
                  {lastParsedPacket.fileReferences.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadedFileName &&
        uploadedFileSize !== null &&
        uploadedFileSha256 &&
        uploadedFileMd5 && (
          <FileInfo
            fileName={uploadedFileName}
            fileSize={uploadedFileSize}
            sha256Hash={uploadedFileSha256}
            md5Hash={uploadedFileMd5}
            onVerifyIntegrity={handleVerifyIntegrity}
          />
        )}

      <ChainOfCustodyLog />
    </div>
  );
};

export default PcapUpload;
