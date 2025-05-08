import React from 'react';
import { Activity, Database, FileText, Clock, Settings, Filter, Hash, Text } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={20} /> },
    { id: 'packets', label: 'Packets', icon: <Database size={20} /> },
    { id: 'files', label: 'Files', icon: <FileText size={20} /> },
    { id: 'tokens', label: 'Tokens', icon: <Hash size={20} /> },
    { id: 'strings', label: 'Strings', icon: <Text size={20} /> },
    { id: 'history', label: 'History', icon: <Clock size={20} /> },
    { id: 'filters', label: 'Filters', icon: <Filter size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside 
      className={`bg-gray-800 text-white w-64 min-h-screen flex-shrink-0 shadow-lg transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:static z-10`}
    >
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-blue-400">Navigation</h2>
      </div>
      
      <nav className="py-4">
        <ul>
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => onChangeTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span>System Status: Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;