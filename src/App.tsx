import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import PacketsList from './components/packets/PacketsList';
import ParserForm from './components/parser/ParserForm';
import FilesList from './components/files/FilesList';
import TokensList from './components/tokens/TokensList';
import StringsList from './components/strings/StringsList';
import PerformanceDashboard from './components/performance/PerformanceDashboard';
import ForensicAnalysis from './components/forensics/ForensicAnalysis';
import TimelineView from './components/timeline/TimelineView';
import ThreatIntelligence from './components/threats/ThreatIntelligence';
import AdvancedSearch from './components/search/AdvancedSearch';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  // Listen for navigation events
  React.useEffect(() => {
    const handleNavigateEvent = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('navigateTab', handleNavigateEvent as EventListener);
    return () => {
      window.removeEventListener('navigateTab', handleNavigateEvent as EventListener);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'packets':
        return <PacketsList />;
      case 'forensics':
        return <ForensicAnalysis />;
      case 'timeline':
        return <TimelineView />;
      case 'threats':
        return <ThreatIntelligence />;
      case 'parser':
      case 'filters':
        return <ParserForm />;
      case 'files':
        return <FilesList />;
      case 'tokens':
        return <TokensList />;
      case 'strings':
        return <StringsList />;
      case 'performance':
        return <PerformanceDashboard />;
      case 'search':
        return <AdvancedSearch />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          activeTab={activeTab} 
          onChangeTab={handleNavigate} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-900">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;