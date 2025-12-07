import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import database from '../../services/database';
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
import { useAlertStore } from '../../store/alertStore';
import { runThreatDetection } from '../../utils/threatDetection';
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
import { LiveTimelineView } from '../LiveTimelineView';

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
    let packets: ParsedPacket[] = [];
    if (activeSessionId) {
      packets = await database.getPacketsBySession(activeSessionId);
    } else {
      // Fallback or empty? Maybe show recent from all?
      // Let's force empty if no session selected to be clean.
      packets = [];
    }
    const files = await database.getAllFiles(); // TODO: Filter files by session too if we add sessionId to files

    // Run threat detection
    const threatPromises = packets.map((packet) => runThreatDetection(packet));
    const threatsResults = await Promise.all(threatPromises);
    const detectedThreats = threatsResults.flat();
    setAllThreats(detectedThreats);

    // Filter out false positives for stats
    const alertStates = useAlertStore.getState().alertStates;
    const activeThreats = detectedThreats.filter(
      (t) => alertStates[t.id]?.status !== 'false_positive',
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

    // Optimization: Only update allPackets if count changed to avoid costly re-renders of TimelineView
    setAllPackets((prev) => {
      if (prev.length !== packets.length) {
        return packets;
      }
      return prev;
    });
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
        <div className="lg:col-span-1" id="chart-protocol">
          <ProtocolDistribution packets={allPackets} />
        </div>
        <div className="lg:col-span-2" id="chart-timeline">
          <TrafficVolume packets={allPackets} />
        </div>

        {/* Top Talkers */}
        <div className="lg:col-span-1 min-h-[350px]" id="chart-toptalkers">
          <TopTalkers
            packets={allPackets}
            onFilterClick={handleTopTalkerClick}
          />
        </div>

        {/* Geo Map */}
        <div className="lg:col-span-2 min-h-[350px]" id="chart-geomap">
          <GeoMap packets={allPackets} />
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

  return (
    <div
      className={`flex ${layoutMode === 'left' ? 'flex-row' : 'flex-col'} h-full ${isGlobalParsing ? 'cursor-wait' : ''
        }`}
    >
      {/* Header / Session Selector Area */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-white/10 px-6 py-2 flex justify-between items-center">
        <SessionSelector />
        <ConnectionStatus />

      </div>

      {/* Navigation Tabs */}
      <div
        className={`flex ${layoutMode === 'left'
          ? 'flex-col border-r w-64 p-2 space-y-1'
          : 'flex-row border-b items-center'
          } border-white/10 ${layoutMode === 'top' ? 'mb-6' : ''} bg-background/50 backdrop-blur-sm`}
      >
        <div
          className={`flex items-center ${layoutMode === 'top' ? 'mr-2 px-2' : 'mb-4 justify-end'}`}
        >
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
        </div>

        {navButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => !isGlobalParsing && setActiveTab(btn.id)}
            disabled={isGlobalParsing}
            className={`
              px-6 py-3 text-sm font-medium transition-colors
              ${layoutMode === 'left'
                ? 'text-left w-full rounded-md border-l-2'
                : 'border-b-2'
              }
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
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
          <div className="h-full p-4 space-y-6">
            <LivePacketList />
            <LiveTimelineView />
          </div>
        )}
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
