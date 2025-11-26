import React, { useState, useEffect } from 'react';
import database from '../../services/database';
import type { ParsedPacket } from '../../types';
import {
    BarChart3, Activity, Shield, FileText, Clock,
    AlertTriangle
} from 'lucide-react';
import PcapUpload from '../parser/PcapUpload';
import PcapAnalysisPage from '../../pages/PcapAnalysisPage';

interface DashboardProps {
    onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalPackets: 0,
        totalFiles: 0,
        threatsDetected: 0,
        suspiciousActivities: 0,
        protocols: {} as Record<string, number>
    });
    const [recentActivity, setRecentActivity] = useState<ParsedPacket[]>([]);

    useEffect(() => {
        updateStats();

        // Set up polling for real-time updates
        const intervalId = setInterval(updateStats, 2000);
        return () => clearInterval(intervalId);
    }, []);

    const updateStats = () => {
        const packets = database.getAllPackets();
        const files = database.getAllFiles();
        const threats = database.getAllThreatIntelligence();

        // Calculate protocol distribution
        const protocols: Record<string, number> = {};
        packets.forEach(p => {
            protocols[p.protocol] = (protocols[p.protocol] || 0) + 1;
        });

        // Count suspicious activities
        const suspiciousCount = packets.reduce((count, p) =>
            count + (p.suspiciousIndicators?.length || 0), 0
        );

        setStats({
            totalPackets: packets.length,
            totalFiles: files.length,
            threatsDetected: threats.length,
            suspiciousActivities: suspiciousCount,
            protocols
        });

        // Get recent activity (last 5 packets)
        setRecentActivity(packets.slice(-5).reverse());
    };

    const renderOverview = () => (
        <div className="space-y-6 animate-fadeIn">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400">Total Packets</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalPackets}</h3>
                        </div>
                        <div className="p-2 bg-blue-900/30 rounded-md text-blue-400">
                            <Activity size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-green-400 mt-2 flex items-center">
                        <Activity size={12} className="mr-1" /> Active monitoring
                    </p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400">Files Extracted</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalFiles}</h3>
                        </div>
                        <div className="p-2 bg-purple-900/30 rounded-md text-purple-400">
                            <FileText size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">From parsed traffic</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400">Threats Detected</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.threatsDetected}</h3>
                        </div>
                        <div className="p-2 bg-red-900/30 rounded-md text-red-400">
                            <Shield size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-red-400 mt-2">Requires attention</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400">Suspicious Events</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.suspiciousActivities}</h3>
                        </div>
                        <div className="p-2 bg-orange-900/30 rounded-md text-orange-400">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-orange-400 mt-2">Potential risks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Protocol Distribution */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BarChart3 size={18} className="mr-2 text-blue-400" />
                        Protocol Distribution
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(stats.protocols).length > 0 ? (
                            Object.entries(stats.protocols)
                                .sort(([, a], [, b]) => b - a)
                                .map(([protocol, count]) => (
                                    <div key={protocol}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{protocol}</span>
                                            <span className="text-gray-400">{count} packets ({Math.round(count / stats.totalPackets * 100)}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${(count / stats.totalPackets) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No data available. Start capturing or upload a PCAP file.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Clock size={18} className="mr-2 text-green-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map(packet => (
                                <div key={packet.id} className="flex items-start pb-3 border-b border-gray-700 last:border-0 last:pb-0">
                                    <div className={`mt-1 w-2 h-2 rounded-full mr-3 ${packet.suspiciousIndicators && packet.suspiciousIndicators.length > 0
                                        ? 'bg-red-500'
                                        : 'bg-green-500'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {packet.protocol} request to {packet.destination}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(packet.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('parser')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'parser'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                        }`}
                >
                    Parser & Upload
                </button>
                <button
                    onClick={() => setActiveTab('packets')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'packets'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                        }`}
                >
                    Packet Inspector
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'parser' && <PcapUpload />}
                {activeTab === 'packets' && <PcapAnalysisPage />}
            </div>
        </div>
    );
};

export default Dashboard;
