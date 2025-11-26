import React, { useState, useEffect } from 'react';
import database from '../../services/database';
import type { ParsedPacket } from '../../types';
import {
    Search, Trash2, Download, FileText, ChevronDown, ChevronRight,
    Shield, Activity, Clock, Server, Globe
} from 'lucide-react';

const PacketView: React.FC = () => {
    const [packets, setPackets] = useState<ParsedPacket[]>([]);
    const [filteredPackets, setFilteredPackets] = useState<ParsedPacket[]>([]);
    const [selectedPacket, setSelectedPacket] = useState<ParsedPacket | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProtocol, setFilterProtocol] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadPackets();

        // Set up a polling interval to refresh data (simulating real-time updates)
        const intervalId = setInterval(() => {
            loadPackets();
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        filterPackets();
    }, [packets, searchTerm, filterProtocol, sortOrder]);

    const loadPackets = () => {
        const allPackets = database.getAllPackets();
        // Only update if count changed to avoid unnecessary re-renders
        setPackets(prev => {
            if (prev.length !== allPackets.length) {
                return allPackets;
            }
            return prev;
        });
    };

    const filterPackets = () => {
        let result = [...packets];

        // Apply search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.source.toLowerCase().includes(lowerTerm) ||
                p.destination.toLowerCase().includes(lowerTerm) ||
                p.protocol.toLowerCase().includes(lowerTerm) ||
                p.rawData.toLowerCase().includes(lowerTerm)
            );
        }

        // Apply protocol filter
        if (filterProtocol !== 'ALL') {
            result = result.filter(p => p.protocol === filterProtocol);
        }

        // Apply sort
        result.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });

        setFilteredPackets(result);
    };

    const handleDeletePacket = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        database.deletePacket(id);
        loadPackets();
        if (selectedPacket?.id === id) {
            setSelectedPacket(null);
        }
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete all packets?')) {
            database.clearAllData();
            loadPackets();
            setSelectedPacket(null);
        }
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const getProtocolColor = (protocol: string) => {
        switch (protocol) {
            case 'HTTP': return 'text-green-400';
            case 'HTTPS': return 'text-green-500';
            case 'TCP': return 'text-blue-400';
            case 'UDP': return 'text-orange-400';
            case 'DNS': return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-500 bg-red-900/20 border-red-800';
            case 'high': return 'text-orange-500 bg-orange-900/20 border-orange-800';
            case 'medium': return 'text-yellow-500 bg-yellow-900/20 border-yellow-800';
            case 'low': return 'text-blue-500 bg-blue-900/20 border-blue-800';
            default: return 'text-gray-500 bg-gray-800 border-gray-700';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Packet List */}
            <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden border border-gray-700">
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center">
                            <Activity size={18} className="mr-2 text-blue-400" />
                            Captured Packets
                            <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                                {filteredPackets.length}
                            </span>
                        </h2>
                        <button
                            onClick={handleClearAll}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center"
                            title="Clear all packets"
                        >
                            <Trash2 size={14} className="mr-1" />
                            Clear
                        </button>
                    </div>

                    <div className="flex space-x-2 mb-3">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search packets..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
                            title={sortOrder === 'asc' ? "Oldest first" : "Newest first"}
                        >
                            <Clock size={16} />
                        </button>
                    </div>

                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['ALL', 'HTTP', 'HTTPS', 'TCP', 'UDP', 'DNS'].map(proto => (
                            <button
                                key={proto}
                                onClick={() => setFilterProtocol(proto)}
                                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${filterProtocol === proto
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                    }`}
                            >
                                {proto}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredPackets.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>No packets found</p>
                            {searchTerm && <p className="text-xs mt-1">Try adjusting your filters</p>}
                        </div>
                    ) : (
                        filteredPackets.map(packet => (
                            <div
                                key={packet.id}
                                onClick={() => setSelectedPacket(packet)}
                                className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedPacket?.id === packet.id
                                        ? 'bg-blue-900/30 border-blue-500'
                                        : 'bg-gray-750 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center">
                                        <span className={`text-xs font-bold mr-2 ${getProtocolColor(packet.protocol)}`}>
                                            {packet.protocol}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(packet.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    {packet.suspiciousIndicators && packet.suspiciousIndicators.length > 0 && (
                                        <Shield size={14} className="text-red-400" />
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-sm mb-1">
                                    <div className="flex items-center text-gray-300 truncate max-w-[180px]">
                                        <Globe size={12} className="mr-1 text-gray-500" />
                                        <span className="truncate">{packet.destination}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex space-x-2">
                                        {packet.fileReferences.length > 0 && (
                                            <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded flex items-center">
                                                <FileText size={10} className="mr-1" />
                                                {packet.fileReferences.length}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleDeletePacket(packet.id, e)}
                                        className="text-gray-600 hover:text-red-400 p-1"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Packet Details */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden border border-gray-700">
                {selectedPacket ? (
                    <>
                        <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center">
                                    <span className={`mr-2 ${getProtocolColor(selectedPacket.protocol)}`}>
                                        {selectedPacket.protocol}
                                    </span>
                                    Packet Details
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">ID: {selectedPacket.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-300">{new Date(selectedPacket.timestamp).toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{selectedPacket.rawData.length} bytes</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Connection Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <h3 className="text-xs font-uppercase text-gray-500 mb-2 flex items-center">
                                        <Server size={12} className="mr-1" /> SOURCE
                                    </h3>
                                    <p className="text-lg font-mono text-blue-400">{selectedPacket.source}</p>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <h3 className="text-xs font-uppercase text-gray-500 mb-2 flex items-center">
                                        <Globe size={12} className="mr-1" /> DESTINATION
                                    </h3>
                                    <p className="text-lg font-mono text-green-400">{selectedPacket.destination}</p>
                                </div>
                            </div>

                            {/* Suspicious Indicators */}
                            {selectedPacket.suspiciousIndicators && selectedPacket.suspiciousIndicators.length > 0 && (
                                <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
                                        <Shield size={16} className="mr-2" />
                                        Security Alerts
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedPacket.suspiciousIndicators.map(indicator => (
                                            <div key={indicator.id} className={`p-3 rounded border ${getSeverityColor(indicator.severity)}`}>
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium capitalize">{indicator.type.replace('_', ' ')}</span>
                                                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-black/20">
                                                        {indicator.severity}
                                                    </span>
                                                </div>
                                                <p className="text-sm mt-1 opacity-90">{indicator.description}</p>
                                                <p className="text-xs mt-2 font-mono bg-black/20 p-1 rounded truncate">
                                                    {indicator.evidence}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* File References */}
                            {selectedPacket.fileReferences.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                                        <FileText size={16} className="mr-2 text-blue-400" />
                                        Extracted Files
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedPacket.fileReferences.map(file => (
                                            <div key={file.id} className="bg-gray-750 border border-gray-700 p-3 rounded-lg flex justify-between items-center">
                                                <div className="truncate mr-3">
                                                    <p className="text-sm font-medium text-gray-200 truncate" title={file.fileName}>
                                                        {file.fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{file.uri}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    {file.downloadStatus === 'downloaded' ? (
                                                        <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50 mr-2">
                                                            Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded border border-yellow-900/50 mr-2">
                                                            {file.downloadStatus}
                                                        </span>
                                                    )}
                                                    <button className="text-gray-400 hover:text-white">
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content Sections */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Packet Content</h3>
                                <div className="space-y-3">
                                    {selectedPacket.sections.map(section => (
                                        <div key={section.id} className="border border-gray-700 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSection(section.id)}
                                                className="w-full flex justify-between items-center p-3 bg-gray-750 hover:bg-gray-700 transition-colors"
                                            >
                                                <span className="text-sm font-medium text-gray-300 capitalize flex items-center">
                                                    {section.type} Section
                                                    <span className="ml-2 text-xs text-gray-500 font-normal">
                                                        ({section.endIndex - section.startIndex} tokens)
                                                    </span>
                                                </span>
                                                {expandedSections[section.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>

                                            {expandedSections[section.id] && (
                                                <div className="p-3 bg-gray-900 font-mono text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                                                    {section.content}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Raw Data */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Raw Data</h3>
                                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 font-mono text-xs text-gray-500 overflow-x-auto max-h-60">
                                    {selectedPacket.rawData}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-10">
                        <Activity size={48} className="mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-2">No Packet Selected</h3>
                        <p className="text-sm text-center max-w-xs">
                            Select a packet from the list to view its details, extracted files, and security analysis.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PacketView;
