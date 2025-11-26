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



    return (
        <div className="bg-card border border-white/10 rounded-lg shadow-sm flex flex-col overflow-hidden backdrop-blur-sm h-full">
            <div className="p-3 border-b border-white/10 bg-card/50">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold flex items-center text-foreground">
                        <Activity size={16} className="mr-2 text-primary" />
                        Captured Packets
                        <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                            {filteredPackets.length}
                        </span>
                    </h2>
                    <button
                        onClick={handleClearAll}
                        className="text-xs text-destructive hover:text-destructive/80 flex items-center transition-colors"
                        title="Clear all packets"
                    >
                        <Trash2 size={14} className="mr-1" />
                        Clear
                    </button>
                </div>

                <div className="flex space-x-2 mb-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search packets..."
                            className="w-full bg-secondary border border-white/10 rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-muted-foreground transition-colors"
                        title={sortOrder === 'asc' ? "Oldest first" : "Newest first"}
                    >
                        <Clock size={16} />
                    </button>
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['ALL', 'HTTP', 'HTTPS', 'TCP', 'UDP', 'DNS'].map(proto => (
                        <button
                            key={proto}
                            onClick={() => setFilterProtocol(proto)}
                            className={`px-3 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${filterProtocol === proto
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                }`}
                        >
                            {proto}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredPackets.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p className="text-sm">No packets found</p>
                        {searchTerm && <p className="text-xs mt-1 opacity-70">Try adjusting your filters</p>}
                    </div>
                ) : (
                    filteredPackets.map(packet => (
                        <div
                            key={packet.id}
                            data-testid={`packet-item-${packet.id}`}
                            onClick={() => onPacketSelect(packet)}
                            className={`p-2 rounded-md cursor-pointer border transition-all duration-200 ${selectedPacketId === packet.id
                                ? 'bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(124,58,237,0.1)]'
                                : 'bg-card/30 border-transparent hover:bg-secondary/50 hover:border-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${packet.protocol === 'HTTP' || packet.protocol === 'HTTPS' ? 'bg-emerald-500/10 text-emerald-500' :
                                        packet.protocol === 'TCP' ? 'bg-blue-500/10 text-blue-500' :
                                            packet.protocol === 'UDP' ? 'bg-orange-500/10 text-orange-500' :
                                                packet.protocol === 'DNS' ? 'bg-purple-500/10 text-purple-500' :
                                                    'bg-gray-500/10 text-gray-400'
                                        }`}>
                                        {packet.protocol}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {new Date(packet.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                {packet.suspiciousIndicators && packet.suspiciousIndicators.length > 0 && (
                                    <Shield size={12} className="text-destructive" />
                                )}
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-xs font-mono text-foreground/80 truncate max-w-[180px]">
                                    <span className="truncate">{packet.source} → {packet.destination}</span>
                                </div>
                                <button
                                    onClick={(e) => handleDeletePacket(packet.id, e)}
                                    className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
