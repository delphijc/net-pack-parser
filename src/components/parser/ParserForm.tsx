import React, { useState, useRef } from 'react';
import { parseNetworkData, downloadFile, startNetworkCapture, stopNetworkCapture } from '../../utils/parser';
import database from '../../services/database';
import { ParsedPacket } from '../../types';
import { Terminal, Send, AlertTriangle, Loader2, Upload, Wifi, StopCircle, Play } from 'lucide-react';

const ParserForm: React.FC = () => {
  const [inputData, setInputData] = useState('');
  const [parsing, setParsing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedData, setCapturedData] = useState<ParsedPacket[]>([]);
  const [lastParsedPacket, setLastParsedPacket] = useState<ParsedPacket | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputData.trim()) {
      setErrorMessage('Please enter some data to parse');
      return;
    }
    
    try {
      setParsing(true);
      setErrorMessage('');
      
      // Parse the input data
      const parsedPacket = parseNetworkData(inputData);
      
      // Store the parsed packet in the database
      database.storePacket(parsedPacket);
      
      // Process file downloads
      const filePromises = parsedPacket.fileReferences.map(async (fileRef) => {
        const updatedFile = await downloadFile(fileRef);
        database.updateFileReference(updatedFile);
        return updatedFile;
      });
      
      // Wait for all file downloads to complete
      await Promise.all(filePromises);
      
      // Set the last parsed packet
      setLastParsedPacket(parsedPacket);
      
      // Clear the input data
      setInputData('');
      setCapturedData([]);
    } catch (error) {
      console.error('Error parsing data:', error);
      setErrorMessage('Failed to parse data. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsing(true);
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const parsedPacket = parseNetworkData(buffer);
      
      database.storePacket(parsedPacket);
      setLastParsedPacket(parsedPacket);
      setInputData('');
      setCapturedData([]);
    } catch (error) {
      console.error('Error parsing PCAP file:', error);
      setErrorMessage('Failed to parse PCAP file. Please ensure it\'s a valid capture file.');
    } finally {
      setParsing(false);
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
          
          // Load the first packet's rawData into the input field
          if (packets[0].rawData) {
            setInputData(packets[0].rawData);
          }
        } else {
          setErrorMessage('No network traffic was captured. Try visiting different websites while capturing.');
        }
      } else {
        setErrorMessage('');
        setCapturedData([]);
        
        // Start network capture with a callback that updates the UI in real-time
        await startNetworkCapture((packet) => {
          setCapturedData(prev => {
            // Only add the packet if it's not already in the array
            if (!prev.some(p => p.id === packet.id)) {
              return [...prev, packet];
            }
            return prev;
          });
        });
        
        setCapturing(true);
      }
    } catch (error) {
      console.error('Error with network capture:', error);
      setErrorMessage('Failed to start network capture. Please ensure you have the necessary permissions.');
      setCapturing(false);
    }
  };

  const handleParseCapture = () => {
    if (capturedData.length === 0) {
      setErrorMessage('No captured data to parse');
      return;
    }

    // Store all captured packets in the database
    capturedData.forEach(packet => {
      database.storePacket(packet);
    });

    // Set the last packet as the most recently parsed
    setLastParsedPacket(capturedData[capturedData.length - 1]);
    
    // Clear the captured data
    setCapturedData([]);
  };
  
  const sampleData = [
    'GET /api/users HTTP/1.1\nHost: example.com\nUser-Agent: Mozilla/5.0\nAccept: */*\n\nid=123&name=John',
    'HTTP/1.1 200 OK\nContent-Type: application/json\nServer: nginx\n\n{"data": {"url": "https://example.com/files/document.pdf", "items": [1, 2, 3]}}',
    'From: user@example.com\nTo: admin@example.com\nSubject: Weekly Report\n\nPlease find the attached report at https://example.com/reports/weekly.xlsx'
  ];
  
  const loadSampleData = (index: number) => {
    setInputData(sampleData[index]);
  };
  
  const handleViewPacket = (packet: ParsedPacket) => {
    // Load the raw data into the input field
    setInputData(packet.rawData);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Network Traffic Parser</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Terminal size={20} className="text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold">Parse Network Data</h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCaptureToggle}
                  className={`px-4 py-2 rounded-md text-sm flex items-center ${
                    capturing 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
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
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm flex items-center"
                >
                  <Upload size={16} className="mr-2" />
                  Upload PCAP
                </button>
              </div>
            </div>
            
            {capturedData.length > 0 && (
              <div className="mb-4 bg-gray-900 p-4 rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">
                    Captured Packets ({capturedData.length})
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleParseCapture}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center"
                    >
                      <Play size={14} className="mr-1.5" />
                      Parse All
                    </button>
                    {capturing && (
                      <div className="flex items-center text-xs text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        Capturing...
                      </div>
                    )}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {capturedData.map((packet, index) => (
                    <div 
                      key={packet.id} 
                      className="mb-1 py-1 px-2 hover:bg-gray-800 rounded cursor-pointer flex justify-between items-center"
                      onClick={() => handleViewPacket(packet)}
                    >
                      <div className="text-sm truncate">
                        {index + 1}. {packet.protocol} - {packet.destination}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {capturing && capturedData.length === 0 && (
              <div className="mb-4 bg-blue-900/30 border border-blue-800 rounded-md p-3 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <p className="text-sm text-blue-300">
                  Waiting for network traffic... Open websites or perform network operations to capture traffic.
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="inputData" className="block text-sm font-medium text-gray-400 mb-2">
                  Enter Network Data to Parse
                </label>
                <textarea
                  id="inputData"
                  className="w-full h-48 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Paste network traffic data here (HTTP headers, email content, etc.)"
                ></textarea>
              </div>
              
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-md flex items-start">
                  <AlertTriangle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{errorMessage}</p>
                </div>
              )}
              
              <div className="flex flex-wrap items-center justify-between">
                <div className="mb-2 md:mb-0">
                  <button
                    type="button"
                    className="text-xs text-blue-400 hover:text-blue-300 mr-3"
                    onClick={() => loadSampleData(0)}
                  >
                    Load HTTP Request
                  </button>
                  <button
                    type="button"
                    className="text-xs text-blue-400 hover:text-blue-300 mr-3"
                    onClick={() => loadSampleData(1)}
                  >
                    Load HTTP Response
                  </button>
                  <button
                    type="button"
                    className="text-xs text-blue-400 hover:text-blue-300"
                    onClick={() => loadSampleData(2)}
                  >
                    Load Email
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={parsing}
                  className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
                    parsing
                      ? 'bg-blue-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
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
          <div className="bg-gray-800 rounded-lg shadow-md p-6 h-full">
            <h2 className="text-lg font-semibold mb-4">Quick Help</h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-blue-400 mb-1">What data can I parse?</h3>
                <p className="text-gray-400">
                  You can paste any network traffic data including HTTP requests/responses, 
                  emails, JSON payloads, and more. You can also upload PCAP files from Wireshark
                  or use direct network capture.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-blue-400 mb-1">How does it work?</h3>
                <p className="text-gray-400">
                  The parser extracts tokens (non-alphanumeric characters) and string content, 
                  identifies sections, and detects file references in URLs. For PCAP files,
                  it analyzes packet headers and payload data.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-blue-400 mb-1">Where is data stored?</h3>
                <p className="text-gray-400">
                  All parsed data is stored locally in your browser. Nothing is sent to external servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {lastParsedPacket && (
        <div className="mt-6 bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500 animate-fadeIn">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Successfully Parsed Packet
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Packet Information</h3>
              <div className="bg-gray-900 p-3 rounded">
                <p className="text-sm"><span className="text-gray-500">ID:</span> {lastParsedPacket.id}</p>
                <p className="text-sm"><span className="text-gray-500">Protocol:</span> {lastParsedPacket.protocol}</p>
                <p className="text-sm">
                  <span className="text-gray-500">Source:</span> {lastParsedPacket.source}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Destination:</span> {lastParsedPacket.destination}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Extracted Data</h3>
              <div className="bg-gray-900 p-3 rounded">
                <p className="text-sm">
                  <span className="text-gray-500">Tokens:</span> {lastParsedPacket.tokens.filter(t => t.type === 'token').length}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Strings:</span> {lastParsedPacket.tokens.filter(t => t.type === 'string').length}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Sections:</span> {lastParsedPacket.sections.length}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">File References:</span> {lastParsedPacket.fileReferences.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParserForm;