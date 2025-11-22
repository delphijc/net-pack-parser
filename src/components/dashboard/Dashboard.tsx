import React from 'react';
import { BarChart, LineChart, PieChart, DatabaseIcon, FileText, Hash, Text } from 'lucide-react';
import database from '../../services/database';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const packets = database.getAllPackets();
  const files = database.getAllFiles();

  // Statistics
  const totalPackets = packets.length;
  const totalFiles = files.length;
  const tokenCount = packets.reduce((acc, packet) =>
    acc + packet.tokens.filter(t => t.type === 'token').length, 0);
  const stringCount = packets.reduce((acc, packet) =>
    acc + packet.tokens.filter(t => t.type === 'string').length, 0);

  // Protocol distribution
  const protocolCounts = packets.reduce((acc: Record<string, number>, packet) => {
    acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
    return acc;
  }, {});

  const handleCardClick = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Network Traffic Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Stats Cards */}
        <div
          onClick={() => handleCardClick('packets')}
          className="bg-blue-600 text-white rounded-lg shadow-md p-4 flex items-center cursor-pointer hover:bg-blue-700 transition-colors"
        >
          <div className="bg-blue-700 p-3 rounded-full mr-4">
            <DatabaseIcon size={24} />
          </div>
          <div>
            <p className="text-sm opacity-80">Total Packets</p>
            <p className="text-2xl font-bold">{totalPackets}</p>
          </div>
        </div>

        <div
          onClick={() => handleCardClick('files')}
          className="bg-teal-600 text-white rounded-lg shadow-md p-4 flex items-center cursor-pointer hover:bg-teal-700 transition-colors"
        >
          <div className="bg-teal-700 p-3 rounded-full mr-4">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm opacity-80">Files Referenced</p>
            <p className="text-2xl font-bold">{totalFiles}</p>
          </div>
        </div>

        <div
          onClick={() => handleCardClick('tokens')}
          className="bg-amber-600 text-white rounded-lg shadow-md p-4 flex items-center cursor-pointer hover:bg-amber-700 transition-colors"
        >
          <div className="bg-amber-700 p-3 rounded-full mr-4">
            <Hash size={24} />
          </div>
          <div>
            <p className="text-sm opacity-80">Total Tokens</p>
            <p className="text-2xl font-bold">{tokenCount}</p>
          </div>
        </div>

        <div
          onClick={() => handleCardClick('strings')}
          className="bg-indigo-600 text-white rounded-lg shadow-md p-4 flex items-center cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          <div className="bg-indigo-700 p-3 rounded-full mr-4">
            <Text size={24} />
          </div>
          <div>
            <p className="text-sm opacity-80">Total Strings</p>
            <p className="text-2xl font-bold">{stringCount}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Protocol Distribution</h2>
            <PieChart size={20} className="text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            {totalPackets === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              <div className="w-full">
                {Object.entries(protocolCounts).map(([protocol, count], index) => (
                  <div key={protocol} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{protocol}</span>
                      <span className="text-gray-400">{count}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${['bg-blue-500', 'bg-teal-500', 'bg-purple-500', 'bg-amber-500', 'bg-red-500'][index % 5]
                          }`}
                        style={{ width: `${(count / totalPackets) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Traffic History</h2>
            <LineChart size={20} className="text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            {totalPackets === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              <div className="text-center text-gray-400 flex flex-col items-center">
                <div className="w-16 h-16 mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                  <BarChart size={32} className="text-blue-400" />
                </div>
                <p>Interactive charts will appear as you collect more data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-white mb-2">Ready to capture network traffic?</h2>
            <p className="text-blue-100">Start by parsing some network data to begin analyzing traffic patterns.</p>
          </div>
          <button
            onClick={() => handleCardClick('parser')}
            className="bg-white text-blue-700 px-6 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;