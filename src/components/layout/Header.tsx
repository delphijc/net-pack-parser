import React from 'react';
import { Network, User, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="bg-gray-900 text-white p-4 flex items-center justify-between shadow-md">
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar}
          className="mr-4 p-1 rounded hover:bg-gray-700 transition-colors md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center">
          <Network size={28} className="text-blue-400 mr-2" />
          <h1 className="text-xl font-bold">NetTraffic Parser</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="search"
            placeholder="Search packets..."
            className="px-4 py-2 bg-gray-800 rounded-md text-sm w-40 md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-sm hidden md:inline">Admin</span>
          <User size={20} className="text-gray-300" />
        </div>
      </div>
    </header>
  );
};

export default Header;