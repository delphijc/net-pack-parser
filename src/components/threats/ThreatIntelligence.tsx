import React, { useState, useMemo } from 'react';
import { AlertTriangle, Shield, Eye, Search, Plus, Database, ExternalLink } from 'lucide-react';
import database from '../../services/database';
import { ThreatIntelligence as ThreatIntelligenceType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const ThreatIntelligence: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddThreat, setShowAddThreat] = useState(false);
  const [newThreat, setNewThreat] = useState({
    type: 'malicious_domain' as const,
    value: '',
    severity: 'medium' as const,
    source: '',
    description: ''
  });

  const threats = database.getAllThreatIntelligence();
  const packets = database.getAllPackets();

  // Get all threat intelligence from packets
  const packetThreats = useMemo(() => {
    const allThreats: (ThreatIntelligenceType & { packetId: string })[] = [];
    packets.forEach(packet => {
      if (packet.threatIntelligence) {
        packet.threatIntelligence.forEach(threat => {
          allThreats.push({ ...threat, packetId: packet.id });
        });
      }
    });
    return allThreats;
  }, [packets]);

  // Combine stored threats with packet threats
  const allThreats = useMemo(() => {
    const combined = [...threats.map(t => ({ ...t, packetId: null })), ...packetThreats];
    return combined;
  }, [threats, packetThreats]);

  // Filter threats
  const filteredThreats = useMemo(() => {
    return allThreats.filter(threat => {
      if (searchQuery && !threat.value.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (severityFilter !== 'all' && threat.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && threat.type !== typeFilter) return false;
      return true;
    });
  }, [allThreats, searchQuery, severityFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const severityCounts = allThreats.reduce((acc, threat) => {
      acc[threat.severity] = (acc[threat.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = allThreats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: allThreats.length,
      detected: packetThreats.length,
      stored: threats.length,
      severityCounts,
      typeCounts
    };
  }, [allThreats, packetThreats, threats]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'malicious_domain': return '🌐';
      case 'malicious_ip': return '🖥️';
      case 'malware_signature': return '🦠';
      case 'suspicious_pattern': return '🔍';
      default: return '⚠️';
    }
  };

  const handleAddThreat = () => {
    if (!newThreat.value || !newThreat.description) return;

    const threat: ThreatIntelligenceType = {
      id: uuidv4(),
      type: newThreat.type,
      value: newThreat.value,
      severity: newThreat.severity,
      source: newThreat.source || 'Manual Entry',
      description: newThreat.description,
      lastUpdated: new Date().toISOString()
    };

    database.storeThreatIntelligence(threat);
    setNewThreat({
      type: 'malicious_domain',
      value: '',
      severity: 'medium',
      source: '',
      description: ''
    });
    setShowAddThreat(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AlertTriangle className="text-red-400 mr-3" size={28} />
          <h2 className="text-2xl font-bold">Threat Intelligence</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddThreat(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Threat
          </button>
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="malicious_domain">Malicious Domain</option>
            <option value="malicious_ip">Malicious IP</option>
            <option value="malware_signature">Malware Signature</option>
            <option value="suspicious_pattern">Suspicious Pattern</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Search threats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm w-64"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Threats</h3>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Detected in Traffic</h3>
          <div className="text-2xl font-bold text-red-400">{stats.detected}</div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Stored Intelligence</h3>
          <div className="text-2xl font-bold text-blue-400">{stats.stored}</div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Critical Threats</h3>
          <div className="text-2xl font-bold text-red-400">
            {stats.severityCounts.critical || 0}
          </div>
        </div>
      </div>

      {/* Threat Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Threats by Severity</h2>
          <div className="space-y-3">
            {Object.entries(stats.severityCounts).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getSeverityColor(severity).split(' ')[1]}`}></div>
                  <span className="capitalize">{severity}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Threats by Type</h2>
          <div className="space-y-3">
            {Object.entries(stats.typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">{getTypeIcon(type)}</span>
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threats List */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Threat Intelligence Database</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showing {filteredThreats.length} of {allThreats.length} threats
          </p>
        </div>

        {filteredThreats.length === 0 ? (
          <div className="p-8 text-center">
            <Database size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Threats Found</h3>
            <p className="text-gray-400">
              {allThreats.length === 0
                ? "Add threat intelligence or parse network traffic to populate this database."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredThreats.map((threat) => (
              <div key={threat.id} className="p-4 hover:bg-gray-750">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">{getTypeIcon(threat.type)}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(threat.severity)}`}>
                        {threat.severity.toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm text-gray-400 capitalize">
                        {threat.type.replace('_', ' ')}
                      </span>
                      {threat.packetId && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-900/20 text-red-400 rounded">
                          DETECTED
                        </span>
                      )}
                    </div>

                    <h3 className="font-medium mb-1">{threat.description}</h3>

                    <div className="text-sm text-gray-400 mb-2">
                      <span className="font-mono bg-gray-900 px-2 py-1 rounded">
                        {threat.value}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center space-x-4">
                      <span>Source: {threat.source}</span>
                      <span>Updated: {new Date(threat.lastUpdated).toLocaleDateString()}</span>
                      {threat.packetId && (
                        <span>Packet ID: {threat.packetId.substring(0, 8)}...</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {threat.value.includes('http') && (
                      <button
                        onClick={() => window.open(threat.value, '_blank')}
                        className="p-2 hover:bg-gray-700 rounded"
                        title="Open URL"
                      >
                        <ExternalLink size={16} className="text-gray-400" />
                      </button>
                    )}
                    <button
                      className="p-2 hover:bg-gray-700 rounded"
                      title="View Details"
                    >
                      <Eye size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Threat Modal */}
      {showAddThreat && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Threat Intelligence</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setShowAddThreat(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Threat Type
                  </label>
                  <select
                    value={newThreat.type}
                    onChange={(e) => setNewThreat(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="malicious_domain">Malicious Domain</option>
                    <option value="malicious_ip">Malicious IP</option>
                    <option value="malware_signature">Malware Signature</option>
                    <option value="suspicious_pattern">Suspicious Pattern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={newThreat.value}
                    onChange={(e) => setNewThreat(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., malicious-site.com or 192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Severity
                  </label>
                  <select
                    value={newThreat.severity}
                    onChange={(e) => setNewThreat(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={newThreat.source}
                    onChange={(e) => setNewThreat(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., VirusTotal, Internal Analysis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newThreat.description}
                    onChange={(e) => setNewThreat(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm h-20"
                    placeholder="Describe the threat and its indicators..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddThreat(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddThreat}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                >
                  Add Threat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatIntelligence;