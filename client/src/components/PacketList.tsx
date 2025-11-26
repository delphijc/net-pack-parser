import React, { useState, useEffect } from 'react';
import database from '../services/database'; // Updated import path
import type { ParsedPacket } from '../types'; // Updated import path
import {
    Search, Trash2, Clock, Activity, Shield
} from 'lucide-react'; // Removed unused imports

interface PacketListProps {
    onPacketSelect: (packet: ParsedPacket | null) => void;
    selectedPacketId: string | null;
    disablePolling?: boolean; // New prop to disable automatic polling
}

const PacketList: React.FC<PacketListProps> = ({ onPacketSelect, selectedPacketId, disablePolling }) => {
    const [packets, setPackets] = useState<ParsedPacket[]>([]);
    const [filteredPackets, setFilteredPackets] = useState<ParsedPacket[]>([]);
    // selectedPacket is now managed by the parent via onPacketSelect and selectedPacketId
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProtocol, setFilterProtocol] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    // expandedSections and related functions/state are moved to PacketDetailView or its parent

    useEffect(() => {
        loadPackets();

        let intervalId: ReturnType<typeof setTimeout> | undefined;
        if (!disablePolling) {
            intervalId = setInterval(() => {
                loadPackets();
            }, 2000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [disablePolling]);

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
                (p.rawData && p.rawData.toLowerCase().includes(lowerTerm)) // Check for rawData existence before calling toLowerCase
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
        if (selectedPacketId === id) { // Updated to use selectedPacketId prop
            onPacketSelect(null); // Clear selected packet in parent
        }
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete all packets?')) {
            database.clearAllData();
            loadPackets();
            onPacketSelect(null); // Clear selected packet in parent
        }
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

    return (
        <div className="bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden border border-gray-700">
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
                            data-testid={`packet-item-${packet.id}`}
                            onClick={() => onPacketSelect(packet)} // Updated onClick to use prop
                            className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedPacketId === packet.id // Updated to use selectedPacketId prop
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
                                    {/* Globe icon removed to simplify */}
                                    <span className="truncate">{packet.destination}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <div className="flex space-x-2">
                                    {/* FileText icon removed to simplify */}
                                </div>
                                <button
                                    onClick={(e) => handleDeletePacket(packet.id, e)}
                                    className="text-gray-600 hover:text-red-400 p-1"
                                    title="Delete packet"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PacketList;
