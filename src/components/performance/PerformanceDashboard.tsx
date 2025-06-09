import React, { useState, useMemo } from 'react';
import { Gauge, Clock, Zap, TrendingUp, BarChart3, AlertTriangle, CheckCircle, Activity, Target, Globe } from 'lucide-react';
import database from '../../services/database';
import { PerformanceEntryData } from '../../types';

const PerformanceDashboard: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'all'>('1h');
  
  const performanceEntries = database.getAllPerformanceEntries();
  
  // Filter entries by time
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const timeThresholds = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    const threshold = timeThresholds[timeFilter];
    return performanceEntries.filter(entry => 
      now - new Date(entry.timestamp).getTime() < threshold
    );
  }, [performanceEntries, timeFilter]);
  
  // Group entries by type
  const entriesByType = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      if (!acc[entry.entryType]) {
        acc[entry.entryType] = [];
      }
      acc[entry.entryType].push(entry);
      return acc;
    }, {} as Record<string, PerformanceEntryData[]>);
  }, [filteredEntries]);
  
  // Calculate key metrics
  const metrics = useMemo(() => {
    const navigation = entriesByType.navigation?.[0];
    const resources = entriesByType.resource || [];
    const longTasks = entriesByType.longtask || [];
    const lcp = entriesByType['largest-contentful-paint']?.[0];
    const paint = entriesByType.paint || [];
    
    // Page Load Time (from navigation timing)
    const pageLoadTime = navigation ? 
      navigation.details.loadEventEnd! - navigation.details.domainLookupStart! : 0;
    
    // DOM Interactive Time
    const domInteractiveTime = navigation ?
      navigation.details.domInteractive! - navigation.details.domainLookupStart! : 0;
    
    // First Contentful Paint
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    const fcpTime = fcp ? fcp.startTime : 0;
    
    // Largest Contentful Paint
    const lcpTime = lcp ? (lcp.details.renderTime || lcp.details.loadTime || 0) : 0;
    
    // Long Tasks count and total duration
    const longTasksCount = longTasks.length;
    const longTasksDuration = longTasks.reduce((sum, task) => sum + task.duration, 0);
    
    // Resource timing stats
    const totalResources = resources.length;
    const totalTransferSize = resources.reduce((sum, r) => 
      sum + (r.details.transferSize || 0), 0);
    const avgResourceLoadTime = resources.length > 0 ?
      resources.reduce((sum, r) => sum + r.duration, 0) / resources.length : 0;
    
    return {
      pageLoadTime,
      domInteractiveTime,
      fcpTime,
      lcpTime,
      longTasksCount,
      longTasksDuration,
      totalResources,
      totalTransferSize,
      avgResourceLoadTime
    };
  }, [entriesByType]);
  
  // Performance score calculation (simplified Core Web Vitals approach)
  const performanceScore = useMemo(() => {
    let score = 100;
    
    // Deduct points for slow LCP (> 2.5s is poor)
    if (metrics.lcpTime > 2500) score -= 30;
    else if (metrics.lcpTime > 1200) score -= 15;
    
    // Deduct points for slow FCP (> 1.8s is poor)
    if (metrics.fcpTime > 1800) score -= 20;
    else if (metrics.fcpTime > 1000) score -= 10;
    
    // Deduct points for long tasks
    if (metrics.longTasksCount > 5) score -= 20;
    else if (metrics.longTasksCount > 2) score -= 10;
    
    // Deduct points for slow page load
    if (metrics.pageLoadTime > 5000) score -= 20;
    else if (metrics.pageLoadTime > 3000) score -= 10;
    
    return Math.max(0, score);
  }, [metrics]);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };
  
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };
  
  const clearPerformanceData = () => {
    database.clearPerformanceEntries();
    window.location.reload(); // Refresh to update the dashboard
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={clearPerformanceData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm"
          >
            Clear Data
          </button>
        </div>
      </div>
      
      {/* Performance Score */}
      <div className="mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Performance Score</h2>
            <Gauge className="text-blue-400" size={24} />
          </div>
          <div className="flex items-center">
            <div className={`text-4xl font-bold ${getScoreColor(performanceScore)} mr-4`}>
              {performanceScore}
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${getScoreBg(performanceScore)}`}
                  style={{ width: `${performanceScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {performanceScore >= 90 ? 'Excellent' : 
                 performanceScore >= 70 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Largest Contentful Paint</h3>
            <Target className="text-purple-400" size={20} />
          </div>
          <div className="text-2xl font-bold mb-1">
            {metrics.lcpTime ? formatTime(metrics.lcpTime) : 'N/A'}
          </div>
          <div className="flex items-center text-xs">
            {metrics.lcpTime <= 2500 ? (
              <CheckCircle className="text-green-400 mr-1" size={12} />
            ) : (
              <AlertTriangle className="text-red-400 mr-1" size={12} />
            )}
            <span className="text-gray-500">Target: ≤ 2.5s</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">First Contentful Paint</h3>
            <Zap className="text-yellow-400" size={20} />
          </div>
          <div className="text-2xl font-bold mb-1">
            {metrics.fcpTime ? formatTime(metrics.fcpTime) : 'N/A'}
          </div>
          <div className="flex items-center text-xs">
            {metrics.fcpTime <= 1800 ? (
              <CheckCircle className="text-green-400 mr-1" size={12} />
            ) : (
              <AlertTriangle className="text-red-400 mr-1" size={12} />
            )}
            <span className="text-gray-500">Target: ≤ 1.8s</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Page Load Time</h3>
            <Clock className="text-blue-400" size={20} />
          </div>
          <div className="text-2xl font-bold mb-1">
            {metrics.pageLoadTime ? formatTime(metrics.pageLoadTime) : 'N/A'}
          </div>
          <div className="flex items-center text-xs">
            {metrics.pageLoadTime <= 3000 ? (
              <CheckCircle className="text-green-400 mr-1" size={12} />
            ) : (
              <AlertTriangle className="text-red-400 mr-1" size={12} />
            )}
            <span className="text-gray-500">Target: ≤ 3.0s</span>
          </div>
        </div>
      </div>
      
      {/* Resource & Task Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Resources</h3>
            <Globe className="text-teal-400" size={16} />
          </div>
          <div className="text-xl font-bold">{metrics.totalResources}</div>
          <div className="text-xs text-gray-500">
            Avg: {formatTime(metrics.avgResourceLoadTime)}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Transfer Size</h3>
            <BarChart3 className="text-indigo-400" size={16} />
          </div>
          <div className="text-xl font-bold">{formatSize(metrics.totalTransferSize)}</div>
          <div className="text-xs text-gray-500">Total downloaded</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Long Tasks</h3>
            <Activity className="text-red-400" size={16} />
          </div>
          <div className="text-xl font-bold">{metrics.longTasksCount}</div>
          <div className="text-xs text-gray-500">
            {formatTime(metrics.longTasksDuration)} total
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">DOM Interactive</h3>
            <TrendingUp className="text-green-400" size={16} />
          </div>
          <div className="text-xl font-bold">
            {metrics.domInteractiveTime ? formatTime(metrics.domInteractiveTime) : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Time to interactive</div>
        </div>
      </div>
      
      {/* Performance Entries by Type */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Performance Entries by Type</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showing {filteredEntries.length} entries from the {timeFilter === 'all' ? 'entire' : `last ${timeFilter}`} period
          </p>
        </div>
        
        {Object.keys(entriesByType).length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <Gauge size={32} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Performance Data</h3>
            <p className="text-gray-400 mb-4">
              Start capturing network traffic to collect performance metrics.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(entriesByType).map(([type, entries]) => (
                <div 
                  key={type}
                  className={`bg-gray-900 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMetric === type ? 'ring-2 ring-blue-500' : 'hover:bg-gray-750'
                  }`}
                  onClick={() => setSelectedMetric(selectedMetric === type ? null : type)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">{type}</h3>
                    <span className="text-sm text-gray-400">{entries.length}</span>
                  </div>
                  
                  {type === 'resource' && (
                    <div className="text-sm text-gray-500">
                      <div>Avg Duration: {formatTime(
                        entries.reduce((sum, e) => sum + e.duration, 0) / entries.length
                      )}</div>
                      <div>Total Size: {formatSize(
                        entries.reduce((sum, e) => sum + (e.details.transferSize || 0), 0)
                      )}</div>
                    </div>
                  )}
                  
                  {type === 'longtask' && (
                    <div className="text-sm text-gray-500">
                      Total Duration: {formatTime(
                        entries.reduce((sum, e) => sum + e.duration, 0)
                      )}
                    </div>
                  )}
                  
                  {type === 'navigation' && entries[0] && (
                    <div className="text-sm text-gray-500">
                      <div>Load: {formatTime(entries[0].details.loadEventEnd! - entries[0].details.domainLookupStart!)}</div>
                      <div>DOM: {formatTime(entries[0].details.domInteractive! - entries[0].details.domainLookupStart!)}</div>
                    </div>
                  )}
                  
                  {selectedMetric === type && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {entries.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="text-xs bg-gray-800 p-2 rounded">
                            <div className="font-mono truncate" title={entry.name}>
                              {entry.name}
                            </div>
                            <div className="text-gray-400 mt-1">
                              Duration: {formatTime(entry.duration)} | 
                              Start: {formatTime(entry.startTime)}
                            </div>
                          </div>
                        ))}
                        {entries.length > 5 && (
                          <div className="text-xs text-gray-500 text-center">
                            ... and {entries.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;