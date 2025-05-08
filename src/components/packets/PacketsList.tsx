import React, { useState } from 'react';
import database from '../../services/database';
import { Clock, ArrowDown, ArrowUp, Filter, Trash2, AlertTriangle } from 'lucide-react';
import { ParsedPacket } from '../../types';

const PacketsList: React.FC = () => {
  const [expandedPacketId, setExpandedPacketId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof ParsedPacket>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const packets = database.getAllPackets();

  // Sort packets
  const sortedPackets = [...packets].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });
  
  const handleSort = (field: keyof ParsedPacket) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleDeletePacket = (packetId: string) => {
    database.deletePacket(packetId);
    setExpandedPacketId(null);
    setShowDeleteConfirm(null);
  };

  const handleSendToFilters = (packet: ParsedPacket) => {
    // Store the packet data for filtering
    localStorage.setItem('filter_packet', JSON.stringify(packet));
    // Navigate to filters tab
    window.dispatchEvent(new CustomEvent('navigateTab', { detail: 'filters' }));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const SortIcon = ({ field }: { field: keyof ParsedPacket }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Network Packets</h1>
      
      {packets.length === 0 ? (
        <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
            <Filter size={32} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No packets captured yet</h2>
          <p className="text-gray-400 mb-4">
            Start by parsing some network traffic data to populate this view.
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort('timestamp')}
                    >
                      <span className="mr-1">Time</span>
                      <SortIcon field="timestamp" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort('protocol')}
                    >
                      <span className="mr-1">Protocol</span>
                      <SortIcon field="protocol" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort('source')}
                    >
                      <span className="mr-1">Source</span>
                      <SortIcon field="source" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort('destination')}
                    >
                      <span className="mr-1">Destination</span>
                      <SortIcon field="destination" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedPackets.map((packet) => (
                  <React.Fragment key={packet.id}>
                    <tr className="hover:bg-gray-750">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm">{formatDate(packet.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          packet.protocol === 'HTTP' ? 'bg-green-800 text-green-100' :
                          packet.protocol === 'HTTPS' ? 'bg-blue-800 text-blue-100' :
                          packet.protocol === 'FTP' ? 'bg-purple-800 text-purple-100' :
                          packet.protocol === 'SMTP' ? 'bg-yellow-800 text-yellow-100' :
                          'bg-gray-700 text-gray-100'
                        }`}>
                          {packet.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{packet.source}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{packet.destination}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {packet.rawData.length} bytes
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleSendToFilters(packet)}
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Send to Filters"
                          >
                            <Filter size={16} className="text-blue-400" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(packet.id)}
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Delete Packet"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {showDeleteConfirm === packet.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-red-900/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-red-300">
                              <AlertTriangle size={16} className="mr-2" />
                              <span>Are you sure you want to delete this packet? This action cannot be undone.</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeletePacket(packet.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {expandedPacketId === packet.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-750">
                          <div className="rounded-md bg-gray-800 p-4">
                            <div className="mb-4">
                              <h3 className="text-sm font-semibold text-blue-400 mb-2">Packet Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div className="bg-gray-700 p-3 rounded">
                                  <span className="text-xs text-gray-400 block mb-1">ID</span>
                                  <span className="text-sm font-mono">{packet.id}</span>
                                </div>
                                <div className="bg-gray-700 p-3 rounded">
                                  <span className="text-xs text-gray-400 block mb-1">Timestamp</span>
                                  <span className="text-sm font-mono">{packet.timestamp}</span>
                                </div>
                                <div className="bg-gray-700 p-3 rounded">
                                  <span className="text-xs text-gray-400 block mb-1">Protocol</span>
                                  <span className="text-sm font-mono">{packet.protocol}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <h3 className="text-sm font-semibold text-blue-400 mb-2">Extracted Tokens</h3>
                              <div className="bg-gray-900 p-3 rounded max-h-40 overflow-y-auto font-mono text-sm">
                                {packet.tokens.map((token, index) => (
                                  <span 
                                    key={token.id}
                                    className={`${
                                      token.type === 'token' 
                                        ? 'text-yellow-400' 
                                        : 'text-blue-300'
                                    } ${index > 0 ? 'ml-1' : ''}`}
                                  >
                                    {token.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <h3 className="text-sm font-semibold text-blue-400 mb-2">Sections</h3>
                              <div className="space-y-2">
                                {packet.sections.map(section => (
                                  <div key={section.id} className="bg-gray-700 p-3 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-semibold uppercase text-gray-400">
                                        {section.type}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Indices: {section.startIndex}-{section.endIndex}
                                      </span>
                                    </div>
                                    <div className="bg-gray-800 p-2 rounded font-mono text-xs max-h-20 overflow-y-auto">
                                      {section.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {packet.fileReferences.length > 0 && (
                              <div>
                                <h3 className="text-sm font-semibold text-blue-400 mb-2">File References</h3>
                                <div className="space-y-2">
                                  {packet.fileReferences.map(file => (
                                    <div key={file.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                                      <div>
                                        <div className="font-mono text-sm truncate max-w-xs">{file.uri}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                          {file.fileName} • {file.hash.substring(0, 8)}...
                                        </div>
                                      </div>
                                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                        file.downloadStatus === 'downloaded' 
                                          ? 'bg-green-800 text-green-100' 
                                          : file.downloadStatus === 'failed'
                                            ? 'bg-red-800 text-red-100'
                                            : 'bg-yellow-800 text-yellow-100'
                                      }`}>
                                        {file.downloadStatus}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PacketsList;