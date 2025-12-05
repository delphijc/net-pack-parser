import React, { useState, useEffect } from 'react';
import database from '../../services/database';
import type { ParsedPacket } from '../../types';
import {
  BarChart3,
  Activity,
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportThreatReport } from '../../utils/dataImportExport';
import PcapUpload from '../parser/PcapUpload';
import PcapAnalysisPage from '../../pages/PcapAnalysisPage';
import YaraRuleManager from '../YaraRuleManager';
import { MitreTacticsChart } from './MitreTacticsChart';
import { TopTechniquesTable } from './TopTechniquesTable';
import { KillChainViz } from './KillChainViz';
import { IOCManager } from '../IOCManager';
import { FalsePositivesTab } from '../FalsePositivesTab';
import { ThreatPanel } from '../ThreatPanel';
// import { useQuery } from '@tanstack/react-query'; // Removed
import { useAlertStore } from '../../store/alertStore';
import { runThreatDetection } from '../../utils/threatDetection';
import type { ThreatAlert } from '../../types/threat';

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
    protocols: {} as Record<string, number>,
  });
  const [recentActivity, setRecentActivity] = useState<ParsedPacket[]>([]);

  const [allThreats, setAllThreats] = useState<ThreatAlert[]>([]);

  useEffect(() => {
    updateStats();

    // Set up polling for real-time updates
    const intervalId = setInterval(updateStats, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const updateStats = async () => {
    const packets = await database.getAllPackets();
    const files = await database.getAllFiles();
    // const threats = await database.getAllThreatIntelligence(); // Remove this as it returns wrong type

    // Run threat detection
    const threatPromises = packets.map((packet) => runThreatDetection(packet));
    const threatsResults = await Promise.all(threatPromises);
    const detectedThreats = threatsResults.flat();
    setAllThreats(detectedThreats);

    // Filter out false positives for stats
    const alertStates = useAlertStore.getState().alertStates;
    const activeThreats = detectedThreats.filter(
      (t) => alertStates[t.id]?.status !== 'false_positive'
    );

    // Calculate protocol distribution
    const protocols: Record<string, number> = {};
    packets.forEach((p) => {
      protocols[p.protocol] = (protocols[p.protocol] || 0) + 1;
    });

    // Count suspicious activities
    const suspiciousCount = packets.reduce(
      (count, p) => count + (p.suspiciousIndicators?.length || 0),
      0,
    );

    setStats({
      totalPackets: packets.length,
      totalFiles: files.length,
      threatsDetected: activeThreats.length,
      suspiciousActivities: suspiciousCount,
      protocols,
    });

    // Get recent activity (last 5 packets)
    setRecentActivity(packets.slice(-5).reverse());
  };

  const handleExportThreats = () => {
    const alertStates = useAlertStore.getState().alertStates;
    const enrichedThreats = allThreats.map((threat) => ({
      ...threat,
      ...alertStates[threat.id],
    }));
    exportThreatReport(enrichedThreats);
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Packets</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats.totalPackets}
              </h3>
            </div>
            <div className="p-2 bg-primary/20 rounded-md text-primary">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <Activity size={12} className="mr-1" /> Active monitoring
          </p>
        </div>

        <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Files Extracted</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats.totalFiles}
              </h3>
            </div>
            <div className="p-2 bg-accent/20 rounded-md text-accent">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            From parsed traffic
          </p>
        </div>

        <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Threats Detected</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats.threatsDetected}
              </h3>
            </div>
            <div className="p-2 bg-destructive/20 rounded-md text-destructive">
              <Shield size={20} />
            </div>
          </div>
          <p className="text-xs text-destructive mt-2">Requires attention</p>
        </div>

        <div className="bg-card border border-white/10 p-4 rounded-lg shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Suspicious Events</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats.suspiciousActivities}
              </h3>
            </div>
            <div className="p-2 bg-amber-500/20 rounded-md text-amber-500">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-amber-500 mt-2">Potential risks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protocol Distribution */}
        <div className="bg-card border border-white/10 p-6 rounded-lg shadow-sm backdrop-blur-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
            <BarChart3 size={18} className="mr-2 text-primary" />
            Protocol Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.protocols).length > 0 ? (
              Object.entries(stats.protocols)
                .sort(([, a], [, b]) => b - a)
                .map(([protocol, count]) => (
                  <div key={protocol}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">
                        {protocol}
                      </span>
                      <span className="text-muted-foreground">
                        {count} packets (
                        {Math.round((count / stats.totalPackets) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / stats.totalPackets) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available. Start capturing or upload a PCAP file.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-white/10 p-6 rounded-lg shadow-sm backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Clock size={18} className="mr-2 text-emerald-500" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((packet) => (
                <div
                  key={packet.id}
                  className="flex items-start pb-3 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div
                    className={`mt-1 w-2 h-2 rounded-full mr-3 ${packet.suspiciousIndicators &&
                      packet.suspiciousIndicators.length > 0
                      ? 'bg-destructive'
                      : 'bg-emerald-500'
                      }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {packet.protocol} request to {packet.destIP}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(packet.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
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
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('parser')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'parser'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
            }`}
        >
          Parser & Upload
        </button>
        <button
          onClick={() => setActiveTab('packets')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'packets'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
            }`}
        >
          Packet Inspector
        </button>
        <button
          onClick={() => setActiveTab('yara')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'yara'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
            }`}
        >
          YARA Rules
        </button>
        <button
          onClick={() => setActiveTab('threat-intel')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'threat-intel'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
            }`}
        >
          Threat Intel
        </button>
        <button
          onClick={() => setActiveTab('ioc-manager')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ioc-manager'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
            }`}
        >
          IOC Manager
        </button>
        <button
          onClick={() => setActiveTab('false-positives')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'false-positives'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
            }`}
        >
          False Positives
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'parser' && <PcapUpload />}
        {activeTab === 'packets' && <PcapAnalysisPage />}
        {activeTab === 'yara' && (
          <div className="p-6">
            <YaraRuleManager />
          </div>
        )}
        {activeTab === 'threat-intel' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                MITRE ATT&CK Intelligence
              </h2>
              <Button
                variant="outline"
                onClick={handleExportThreats}
                disabled={allThreats.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MitreTacticsChart threats={allThreats} />
              <TopTechniquesTable threats={allThreats} />
            </div>
            <KillChainViz threats={allThreats} />

            {/* Threat Panel Integration */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Threat Detection Log</h3>
              <ThreatPanel threats={allThreats} onThreatClick={() => { }} />
            </div>
          </div>
        )}
        {activeTab === 'ioc-manager' && <IOCManager />}
        {activeTab === 'false-positives' && <FalsePositivesTab threats={allThreats} />}
      </div>
    </div>
  );
};

export default Dashboard;
