import React, { useState, useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, FileText, Search } from 'lucide-react';
import database from '../../services/database';
import { ParsedPacket, SuspiciousIndicator } from '../../types';

const ForensicAnalysis: React.FC = () => {
  const [selectedPacket, setSelectedPacket] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const packets = database.getAllPackets();

  // Filter packets with suspicious indicators
  const suspiciousPackets = useMemo(() => {
    return packets.filter(packet =>
      packet.suspiciousIndicators && packet.suspiciousIndicators.length > 0
    );
  }, [packets]);

  // Get all suspicious indicators across all packets
  const allIndicators = useMemo(() => {
    const indicators: (SuspiciousIndicator & { packetId: string })[] = [];
    packets.forEach(packet => {
      if (packet.suspiciousIndicators) {
        packet.suspiciousIndicators.forEach(indicator => {
          indicators.push({ ...indicator, packetId: packet.id });
        });
      }
    });
    return indicators;
  }, [packets]);

  // Filter indicators by severity and search query
  const filteredIndicators = useMemo(() => {
    return allIndicators.filter(indicator => {
      if (severityFilter !== 'all' && indicator.severity !== severityFilter) return false;
      if (searchQuery && !indicator.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allIndicators, severityFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const severityCounts = allIndicators.reduce((acc, indicator) => {
      acc[indicator.severity] = (acc[indicator.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = allIndicators.reduce((acc, indicator) => {
      acc[indicator.type] = (acc[indicator.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPackets: packets.length,
      suspiciousPackets: suspiciousPackets.length,
      totalIndicators: allIndicators.length,
      severityCounts,
      typeCounts
    };
  }, [packets, suspiciousPackets, allIndicators]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle size={16} className="text-red-400" />;
      case 'high': return <AlertTriangle size={16} className="text-orange-400" />;
      case 'medium': return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'low': return <CheckCircle size={16} className="text-green-400" />;
      default: return <Eye size={16} className="text-gray-400" />;
    }
  };

  const selectedPacketData = selectedPacket ? packets.find(p => p.id === selectedPacket) : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="text-blue-400 mr-3" size={28} />
          <h2 className="text-2xl font-bold">Forensic Analysis</h2>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Search indicators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm w-64"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Packets</h3>
          <div className="text-2xl font-bold">{stats.totalPackets}</div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Suspicious Packets</h3>
          <div className="text-2xl font-bold text-orange-400">{stats.suspiciousPackets}</div>
          <div className="text-xs text-gray-500">
            {stats.totalPackets > 0 ? Math.round((stats.suspiciousPackets / stats.totalPackets) * 100) : 0}% of total
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Security Indicators</h3>
          <div className="text-2xl font-bold text-red-400">{stats.totalIndicators}</div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Risk Level</h3>
          <div className="text-2xl font-bold">
            {stats.severityCounts.critical > 0 ? (
              <span className="text-red-400">HIGH</span>
            ) : stats.severityCounts.high > 0 ? (
              <span className="text-orange-400">MEDIUM</span>
            ) : (
              <span className="text-green-400">LOW</span>
            )}
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Indicators by Severity</h2>
          <div className="space-y-3">
            {Object.entries(stats.severityCounts).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center">
                  {getSeverityIcon(severity)}
                  <span className="ml-2 capitalize">{severity}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 mr-2">{count}</span>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getSeverityColor(severity).split(' ')[1]}`}
                      style={{ width: `${(count / stats.totalIndicators) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Top Threat Types</h2>
          <div className="space-y-3">
            {Object.entries(stats.typeCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Security Indicators List */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Security Indicators</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showing {filteredIndicators.length} of {allIndicators.length} indicators
          </p>
        </div>

        {filteredIndicators.length === 0 ? (
          <div className="p-8 text-center">
            <Shield size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Security Indicators Found</h3>
            <p className="text-gray-400">
              {allIndicators.length === 0
                ? "Parse some network traffic to begin security analysis."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredIndicators.map((indicator) => {
              const packet = packets.find(p => p.id === indicator.packetId);
              return (
                <div key={indicator.id} className="p-4 hover:bg-gray-750">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getSeverityIcon(indicator.severity)}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getSeverityColor(indicator.severity)}`}>
                          {indicator.severity.toUpperCase()}
                        </span>
                        <span className="ml-2 text-sm text-gray-400 capitalize">
                          {indicator.type.replace('_', ' ')}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          Confidence: {indicator.confidence}%
                        </span>
                      </div>

                      <h3 className="font-medium mb-1">{indicator.description}</h3>

                      <div className="text-sm text-gray-400 mb-2">
                        <span className="font-mono bg-gray-900 px-2 py-1 rounded">
                          {indicator.evidence}
                        </span>
                      </div>

                      {packet && (
                        <div className="text-xs text-gray-500">
                          Packet: {packet.source} → {packet.destination} ({packet.protocol})
                          {indicator.mitreTactic && (
                            <span className="ml-2">
                              MITRE: {indicator.mitreTactic}
                              {indicator.mitreTechnique && ` / ${indicator.mitreTechnique}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedPacket(indicator.packetId)}
                      className="ml-4 p-2 hover:bg-gray-700 rounded"
                      title="View Packet Details"
                    >
                      <Eye size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Packet Details Modal */}
      {selectedPacketData && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Packet Forensic Details</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedPacket(null)}
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Packet Information</h4>
                  <div className="bg-gray-900 p-4 rounded space-y-2 text-sm">
                    <p><span className="text-gray-400">ID:</span> {selectedPacketData.id}</p>
                    <p><span className="text-gray-400">Timestamp:</span> {new Date(selectedPacketData.timestamp).toLocaleString()}</p>
                    <p><span className="text-gray-400">Protocol:</span> {selectedPacketData.protocol}</p>
                    <p><span className="text-gray-400">Source:</span> {selectedPacketData.source}</p>
                    <p><span className="text-gray-400">Destination:</span> {selectedPacketData.destination}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Forensic Metadata</h4>
                  <div className="bg-gray-900 p-4 rounded space-y-2 text-sm">
                    {selectedPacketData.forensicMetadata ? (
                      <>
                        <p><span className="text-gray-400">SHA-256:</span> {selectedPacketData.forensicMetadata.sha256Hash.substring(0, 32)}...</p>
                        <p><span className="text-gray-400">Investigator:</span> {selectedPacketData.forensicMetadata.investigator}</p>
                        <p><span className="text-gray-400">Chain of Custody:</span> {selectedPacketData.forensicMetadata.chainOfCustody.length} entries</p>
                      </>
                    ) : (
                      <p className="text-gray-500">No forensic metadata available</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedPacketData.suspiciousIndicators && selectedPacketData.suspiciousIndicators.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Security Indicators</h4>
                  <div className="space-y-2">
                    {selectedPacketData.suspiciousIndicators.map(indicator => (
                      <div key={indicator.id} className="bg-gray-900 p-3 rounded">
                        <div className="flex items-center mb-2">
                          {getSeverityIcon(indicator.severity)}
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getSeverityColor(indicator.severity)}`}>
                            {indicator.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm mb-1">{indicator.description}</p>
                        <p className="text-xs text-gray-400 font-mono">{indicator.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Raw Packet Data</h4>
                <div className="bg-gray-900 p-4 rounded">
                  <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
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

export default ForensicAnalysis;