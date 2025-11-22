import React, { useState, useMemo } from 'react';
import { Search, Filter, Clock, Database, Eye, AlertTriangle } from 'lucide-react';
import database from '../../services/database';
import { ParsedPacket } from '../../types';

const AdvancedSearch: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    sourceIp: '',
    destIp: '',
    protocol: '',
    startTime: '',
    endTime: '',
    containsString: '',
    hasSuspiciousIndicators: false,
    threatLevel: '',
    portNumber: '',
    fileExtension: ''
  });

  const [searchResults, setSearchResults] = useState<ParsedPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const allPackets = database.getAllPackets();

  const handleSearch = async () => {
    setIsSearching(true);

    // Simulate search delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const results = database.searchPacketsByForensicCriteria({
      sourceIp: searchCriteria.sourceIp || undefined,
      destIp: searchCriteria.destIp || undefined,
      protocol: searchCriteria.protocol || undefined,
      startTime: searchCriteria.startTime || undefined,
      endTime: searchCriteria.endTime || undefined,
      containsString: searchCriteria.containsString || undefined,
      hasSuspiciousIndicators: searchCriteria.hasSuspiciousIndicators,
      threatLevel: searchCriteria.threatLevel || undefined
    });

    // Additional filtering for advanced criteria
    let filteredResults = results;

    if (searchCriteria.portNumber) {
      filteredResults = filteredResults.filter(packet =>
        packet.rawData.includes(`:${searchCriteria.portNumber}`)
      );
    }

    if (searchCriteria.fileExtension) {
      filteredResults = filteredResults.filter(packet =>
        packet.fileReferences.some(file =>
          file.fileName.toLowerCase().endsWith(`.${searchCriteria.fileExtension.toLowerCase()}`)
        )
      );
    }

    setSearchResults(filteredResults);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchCriteria({
      sourceIp: '',
      destIp: '',
      protocol: '',
      startTime: '',
      endTime: '',
      containsString: '',
      hasSuspiciousIndicators: false,
      threatLevel: '',
      portNumber: '',
      fileExtension: ''
    });
    setSearchResults([]);
  };

  const searchStats = useMemo(() => {
    const total = searchResults.length;
    const withThreats = searchResults.filter(p =>
      p.threatIntelligence && p.threatIntelligence.length > 0
    ).length;
    const withSuspicious = searchResults.filter(p =>
      p.suspiciousIndicators && p.suspiciousIndicators.length > 0
    ).length;
    const protocols = searchResults.reduce((acc, packet) => {
      acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, withThreats, withSuspicious, protocols };
  }, [searchResults]);

  const selectedPacketData = selectedPacket ?
    searchResults.find(p => p.id === selectedPacket) : null;

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Search className="text-blue-400 mr-3" size={28} />
        <h2 className="text-2xl font-bold">Advanced Forensic Search</h2>
      </div>

      {/* Search Form */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Search Criteria</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Source IP Address
            </label>
            <input
              type="text"
              value={searchCriteria.sourceIp}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, sourceIp: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., 192.168.1.100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Destination IP Address
            </label>
            <input
              type="text"
              value={searchCriteria.destIp}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, destIp: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., 10.0.0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Protocol
            </label>
            <select
              value={searchCriteria.protocol}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, protocol: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Protocols</option>
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="FTP">FTP</option>
              <option value="SMTP">SMTP</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={searchCriteria.startTime}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={searchCriteria.endTime}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Contains String
            </label>
            <input
              type="text"
              value={searchCriteria.containsString}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, containsString: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
              placeholder="Search packet content..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Port Number
            </label>
            <input
              type="text"
              value={searchCriteria.portNumber}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, portNumber: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., 80, 443, 8080"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              File Extension
            </label>
            <input
              type="text"
              value={searchCriteria.fileExtension}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, fileExtension: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., pdf, exe, zip"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Threat Level
            </label>
            <select
              value={searchCriteria.threatLevel}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, threatLevel: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Any Threat Level</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchCriteria.hasSuspiciousIndicators}
                onChange={(e) => setSearchCriteria(prev => ({
                  ...prev,
                  hasSuspiciousIndicators: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-400">Has Suspicious Indicators</span>
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-2 rounded-md text-sm flex items-center"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Search size={16} className="mr-2" />
                Search
              </>
            )}
          </button>

          <button
            onClick={clearSearch}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-md text-sm flex items-center"
          >
            <Filter size={16} className="mr-2" />
            Clear
          </button>

          <div className="text-sm text-gray-400">
            Total packets: {allPackets.length}
          </div>
        </div>
      </div>

      {/* Search Results Statistics */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Results Found</h3>
            <div className="text-2xl font-bold">{searchStats.total}</div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">With Threats</h3>
            <div className="text-2xl font-bold text-red-400">{searchStats.withThreats}</div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Suspicious</h3>
            <div className="text-2xl font-bold text-yellow-400">{searchStats.withSuspicious}</div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Top Protocol</h3>
            <div className="text-lg font-bold">
              {Object.entries(searchStats.protocols)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Search Results</h2>
          <p className="text-sm text-gray-400 mt-1">
            {searchResults.length > 0
              ? `Found ${searchResults.length} matching packets`
              : 'Enter search criteria and click Search to find packets'
            }
          </p>
        </div>

        {searchResults.length === 0 ? (
          <div className="p-8 text-center">
            <Database size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results</h3>
            <p className="text-gray-400">
              {allPackets.length === 0
                ? "No packets available to search. Parse some network traffic first."
                : "No packets match your search criteria. Try adjusting your filters."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {searchResults.map((packet) => (
              <div key={packet.id} className="p-4 hover:bg-gray-750">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">
                        {new Date(packet.timestamp).toLocaleString()}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${packet.protocol === 'HTTP' ? 'bg-green-800 text-green-100' :
                          packet.protocol === 'HTTPS' ? 'bg-blue-800 text-blue-100' :
                            'bg-gray-700 text-gray-100'
                        }`}>
                        {packet.protocol}
                      </span>
                      {packet.suspiciousIndicators && packet.suspiciousIndicators.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-yellow-900 text-yellow-200 rounded-full flex items-center">
                          <AlertTriangle size={12} className="mr-1" />
                          Suspicious
                        </span>
                      )}
                      {packet.threatIntelligence && packet.threatIntelligence.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-900 text-red-200 rounded-full">
                          Threat Detected
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-300 mb-1">
                      {packet.source} → {packet.destination}
                    </div>

                    <div className="text-xs text-gray-500">
                      Size: {packet.rawData.length} bytes
                      {packet.fileReferences.length > 0 && (
                        <span className="ml-4">
                          Files: {packet.fileReferences.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPacket(packet.id)}
                    className="p-2 hover:bg-gray-700 rounded"
                    title="View Details"
                  >
                    <Eye size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Packet Details Modal */}
      {selectedPacketData && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Packet Details</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedPacket(null)}
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-3">Packet Information</h4>
                  <div className="bg-gray-900 p-4 rounded space-y-2 text-sm">
                    <p><span className="text-gray-400">ID:</span> {selectedPacketData.id}</p>
                    <p><span className="text-gray-400">Timestamp:</span> {new Date(selectedPacketData.timestamp).toLocaleString()}</p>
                    <p><span className="text-gray-400">Protocol:</span> {selectedPacketData.protocol}</p>
                    <p><span className="text-gray-400">Source:</span> {selectedPacketData.source}</p>
                    <p><span className="text-gray-400">Destination:</span> {selectedPacketData.destination}</p>
                    <p><span className="text-gray-400">Size:</span> {selectedPacketData.rawData.length} bytes</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Security Analysis</h4>
                  <div className="bg-gray-900 p-4 rounded space-y-2 text-sm">
                    <p>
                      <span className="text-gray-400">Suspicious Indicators:</span>{' '}
                      {selectedPacketData.suspiciousIndicators?.length || 0}
                    </p>
                    <p>
                      <span className="text-gray-400">Threat Intelligence:</span>{' '}
                      {selectedPacketData.threatIntelligence?.length || 0}
                    </p>
                    <p>
                      <span className="text-gray-400">File References:</span>{' '}
                      {selectedPacketData.fileReferences.length}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Raw Packet Data</h4>
                <div className="bg-gray-900 p-4 rounded max-h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {selectedPacketData.rawData}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;