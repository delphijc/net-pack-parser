import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import { ProtocolDistribution } from './ProtocolDistribution';
import { TrafficVolume } from './TrafficVolume';
import { TopTalkers } from './TopTalkers';
import { GeoMap } from './GeoMap';
import type { ParsedPacket } from '../../types';
import { useSessionStore } from '../../store/sessionStore';
import SessionSelector from './SessionSelector';
import {
  Activity,
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  LayoutTemplate,
  Sidebar,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PcapUpload from '../parser/PcapUpload';
import PcapAnalysisPage from '../../pages/PcapAnalysisPage';
import YaraRuleManager from '../YaraRuleManager';
import { MitreTacticsChart } from './MitreTacticsChart';
import { TopTechniquesTable } from './TopTechniquesTable';
import { KillChainViz } from './KillChainViz';
import { IOCManager } from '../IOCManager';
import { FalsePositivesTab } from '../FalsePositivesTab';
import { ThreatPanel } from '../ThreatPanel';
import SettingsPage from '../SettingsPage';
import { TimelineView } from '../TimelineView';


import type { ThreatAlert } from '../../types/threat';
import {
  ReportGenerator,
  type ReportConfig,
} from '../../services/ReportGenerator';
import html2canvas from 'html2canvas';
import { ReportBuilderDialog } from '../reporting/ReportBuilderDialog';
import { useForensicStore } from '../../store/forensicStore';
import { AgentConnectionPanel } from '../AgentConnectionPanel';
import { ConnectionStatus } from '../ConnectionStatus';
import LivePacketList from '../LivePacketList';


interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboardActiveTab') || 'overview';
  });
  const [isGlobalParsing, setIsGlobalParsing] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'top' | 'left'>('top');

  const [stats, setStats] = useState({
    totalPackets: 0,
    totalFiles: 0,
    threatsDetected: 0,
    suspiciousActivities: 0,
    protocols: {} as Record<string, number>,
    timeline: undefined as { key_as_string: string; doc_count: number }[] | undefined,
    topTalkers: undefined as {
      src: { key: string; doc_count: number }[];
      dest: { key: string; doc_count: number }[];
    } | undefined,
  });

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);
  const [recentActivity, setRecentActivity] = useState<ParsedPacket[]>([]);
  const [allPackets, setAllPackets] = useState<ParsedPacket[]>([]);
  const [allThreats, setAllThreats] = useState<ThreatAlert[]>([]);

  // Load layout preference
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayoutMode');
    if (savedLayout === 'left') {
      setLayoutMode('left');
    }
  }, []);

  const toggleLayout = () => {
    const newMode = layoutMode === 'top' ? 'left' : 'top';
    setLayoutMode(newMode);
    localStorage.setItem('dashboardLayoutMode', newMode);
  };

  const { activeSessionId } = useSessionStore();
  const { caseMetadata } = useForensicStore();

  const updateStats = useCallback(async () => {
    if (!activeSessionId) {
      setStats({
        totalPackets: 0,
        totalFiles: 0,
        threatsDetected: 0,
        suspiciousActivities: 0,
        protocols: {},
        timeline: undefined,
        topTalkers: undefined,
      });
      setAllPackets([]);
      setRecentActivity([]);
      setAllThreats([]);
      return;
    }

    try {
      const statsData = await api.getDashboardStats(activeSessionId);

      const protocols: Record<string, number> = {};
      statsData.protocols.forEach((b) => {
        protocols[b.key] = b.doc_count;
      });

      // Map server recent activity to ParsedPacket (partial)
      // Note: timeline/charts components might expect full arrays.
      // For proper chart rendering relying on 'allPackets' prop, we need to adapt:
      // Charts components currently calculate from 'allPackets'.
      // MIGRATION STEP:
      // 1. Refactor child components (ProtocolDistribution, TrafficVolume, etc.) to accept aggregated data props.
      // 2. OR fetch minimal packet data needed for them?
      // fetching ALL packets is what we want to avoid.
      // Let's pass the aggregated data from statsData to components if possible, or adapt.

      // For now, let's keep allPackets internal state EMPTY or minimal,
      // and adapt child components to optionally take pre-calculated stats.
      // But re-writing all child charts is a bigger task.
      // If we simply populate stats state, the cards will work.
      // Charts need refactoring.

      setStats({
        totalPackets: statsData.totalPackets,
        totalFiles: statsData.files.total,
        threatsDetected: statsData.threats.total,
        suspiciousActivities: 0, // Not explicitly returning distinct suspicious count yet, threats covers it
        protocols,
        timeline: statsData.timeline,
        topTalkers: statsData.topTalkers
      });

      setRecentActivity(statsData.recentActivity);

      // We still need 'allThreats' for the threat panel etc if they are accessed there.
      // We can fetch them or just show nothing/empty there for now until that tab is clicked.
      // But Dashboard passes 'allThreats' to reporting/charts.
      // Getting full threat list might be needed.
      // For MVP dashboard view, we might not need active full list unless user drills down.
      // Leaving allThreats empty or minimal for now to unblock 'Overview'.

    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  }, [activeSessionId]);

  useEffect(() => {
    updateStats();
    const intervalId = setInterval(updateStats, 2000);
    return () => clearInterval(intervalId);
  }, [updateStats]);

  const [initialPacketFilter, setInitialPacketFilter] = useState<string>('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleGenerateReportClick = () => {
    setReportDialogOpen(true);
  };

  const runReportGeneration = async (config: ReportConfig) => {
    const generator = new ReportGenerator();

    const capture = async (id: string, scale = 2) => {
      const el = document.getElementById(id);
      if (el) {
        try {
          const canvas = await html2canvas(el, {
            scale,
            backgroundColor: null,
          });
          return canvas.toDataURL('image/png');
        } catch (e) {
          console.error(`Failed to capture ${id}`, e);
          return undefined;
        }
      }
      return undefined;
    };

    // Capture charts if they are included in selection (or capture all for simplicity, browser might be slow)
    // To optimization: only capture what's needed.
    let protocolImg, timelineImg, topTalkersImg, geoMapImg;

    if (config.sections.includes('protocol'))
      protocolImg = await capture('chart-protocol');
    if (config.sections.includes('timeline'))
      timelineImg = await capture('chart-timeline');
    if (config.sections.includes('toptalkers'))
      topTalkersImg = await capture('chart-toptalkers');
    // Geo map might be heavy, scale 1 might be safer if it crashes, but 2 is better quality
    if (config.sections.includes('geomap'))
      geoMapImg = await capture('chart-geomap');

    const data = await generator.generateReportData(
      {
        protocol: protocolImg,
        timeline: timelineImg,
        topTalkers: topTalkersImg,
        geoMap: geoMapImg,
      },
      allThreats,
    );

    await generator.generatePdf(data, config);
  };

  const handleTopTalkerClick = (ip: string, _type: 'src' | 'dst') => {
    setInitialPacketFilter(`host ${ip}`);
    setActiveTab('packets');
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
        {/* Protocol Distribution & Traffic Volume */}
        <div className="lg:col-span-1 grid grid-cols-1 gap-4 h-[350px]" id="chart-protocol">
          <ProtocolDistribution
            packets={allPackets}
            distribution={Object.entries(stats.protocols || {}).map(([k, v]) => ({ key: k, doc_count: v }))}
          />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-4 h-[350px]" id="chart-timeline">
          <TrafficVolume packets={allPackets} timeline={stats.timeline} />
        </div>

        {/* Top Talkers & Geo Map */}
        <div className="lg:col-span-1 grid grid-cols-1 gap-4 h-[350px]" id="chart-toptalkers">
          <TopTalkers
            packets={allPackets}
            topTalkers={stats.topTalkers}
            onFilterClick={handleTopTalkerClick}
          />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-4 h-[350px]" id="chart-geomap">
          <GeoMap packets={allPackets} onFilterClick={handleTopTalkerClick} />
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-white/10 p-6 rounded-lg shadow-sm backdrop-blur-sm lg:col-span-3">
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

  const navButtons = [
    { id: 'overview', label: 'Overview' },
    { id: 'parser', label: 'Parser & Upload' },
    { id: 'packets', label: 'Packet Inspector' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'yara', label: 'YARA Rules' },
    { id: 'threat-intel', label: 'Threat Intel' },
    { id: 'ioc-manager', label: 'IOC Manager' },
    { id: 'false-positives', label: 'False Positives' },
    { id: 'settings', label: 'Settings' },
    { id: 'agent', label: 'Remote Capture' },
    { id: 'live', label: 'Live Capture' },
  ];

  const LayoutToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLayout}
      title="Toggle Layout Mode"
    >
      {layoutMode === 'top' ? (
        <Sidebar className="h-4 w-4" />
      ) : (
        <LayoutTemplate className="h-4 w-4" />
      )}
    </Button>
  );

  const renderContent = () => (
    <>
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'parser' && (
        <PcapUpload onParsingStatusChange={setIsGlobalParsing} />
      )}
      {activeTab === 'packets' && (
        <PcapAnalysisPage initialFilter={initialPacketFilter} />
      )}
      {activeTab === 'timeline' && (
        <div className="p-6">
          <TimelineView packets={allPackets} />
        </div>
      )}
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerateReportClick}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Summary
              </Button>
              <Button onClick={() => navigate('/')}>
                <Upload className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MitreTacticsChart threats={allThreats} />
            <TopTechniquesTable threats={allThreats} />
          </div>
          <KillChainViz threats={allThreats} />

          {/* Threat Panel Integration */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">
              Threat Detection Log
            </h3>
            <ThreatPanel threats={allThreats} onThreatClick={() => { }} />
          </div>
        </div>
      )}
      {activeTab === 'ioc-manager' && <IOCManager />}
      {activeTab === 'false-positives' && (
        <FalsePositivesTab threats={allThreats} />
      )}
      {activeTab === 'settings' && <SettingsPage />}
      {activeTab === 'agent' && (
        <div className="p-6">
          <AgentConnectionPanel />
        </div>
      )}
      {activeTab === 'live' && (
        <div className="h-full p-4 space-y-4">
          <LivePacketList />
        </div>
      )}
    </>
  );

  if (layoutMode === 'left') {
    return (
      <div className={`flex flex-row h-full ${isGlobalParsing ? 'cursor-wait' : ''}`}>
        {/* Sidebar Container */}
        <div className="w-64 flex flex-col border-r border-white/10 bg-background/50 backdrop-blur-sm">
          {/* Sidebar Header: Session + Controls */}
          <div className="p-4 border-b border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Sessions</span>
              <LayoutToggle />
            </div>
            <SessionSelector />
            <div className="flex justify-end">
              <ConnectionStatus />
            </div>
          </div>

          {/* Vertical Tabs */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
            {navButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => !isGlobalParsing && setActiveTab(btn.id)}
                disabled={isGlobalParsing}
                className={`
                  w-full text-left px-4 py-2 text-sm font-medium transition-colors rounded-md
                  ${activeTab === btn.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }
                  ${isGlobalParsing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto w-full">
          {renderContent()}
        </div>

        <ReportBuilderDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          onGenerate={runReportGeneration}
          defaultSummary={caseMetadata?.summary}
        />
      </div>
    );
  }

  // Default: TOP Layout
  return (
    <div className={`flex flex-col h-full ${isGlobalParsing ? 'cursor-wait' : ''}`}>
      {/* Top Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-white/10 px-6 py-2 flex justify-between items-center">
        <SessionSelector />
        <ConnectionStatus />
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center border-b border-white/10 bg-background/50 backdrop-blur-sm px-4">
        <div className="mr-2">
          <LayoutToggle />
        </div>
        <div className="flex overflow-x-auto no-scrollbar">
          {navButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => !isGlobalParsing && setActiveTab(btn.id)}
              disabled={isGlobalParsing}
              className={`
                  px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                  ${activeTab === btn.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
                  ${isGlobalParsing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      <ReportBuilderDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onGenerate={runReportGeneration}
        defaultSummary={caseMetadata?.summary}
      />
    </div>
  );
};

export default Dashboard;
