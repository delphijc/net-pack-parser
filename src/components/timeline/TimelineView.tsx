import React, { useState, useMemo } from 'react';
import { Baseline as Timeline, Clock, AlertTriangle, Info, Eye, Filter } from 'lucide-react';
import database from '../../services/database';
import { TimelineEvent } from '../../types';

const TimelineView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  
  const allEvents = database.getAllTimelineEvents();
  
  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && event.type !== typeFilter) return false;
      
      if (dateRange.start || dateRange.end) {
        const eventTime = new Date(event.timestamp).getTime();
        if (dateRange.start && eventTime < new Date(dateRange.start).getTime()) return false;
        if (dateRange.end && eventTime > new Date(dateRange.end).getTime()) return false;
      }
      
      return true;
    });
  }, [allEvents, severityFilter, typeFilter, dateRange]);
  
  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    filteredEvents.forEach(event => {
      const date = new Date(event.timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    
    // Sort dates descending
    const sortedDates = Object.keys(groups).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    const sortedGroups: Record<string, TimelineEvent[]> = {};
    sortedDates.forEach(date => {
      sortedGroups[date] = groups[date].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
    
    return sortedGroups;
  }, [filteredEvents]);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'info': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'info': return <Info size={16} className="text-blue-400" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'network_activity': return '🌐';
      case 'file_access': return '📁';
      case 'authentication': return '🔐';
      case 'data_transfer': return '📤';
      case 'suspicious_activity': return '⚠️';
      default: return '📋';
    }
  };
  
  const selectedEventData = selectedEvent ? allEvents.find(e => e.id === selectedEvent) : null;
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Timeline className="text-blue-400 mr-3" size={28} />
          <h1 className="text-2xl font-bold">Timeline Analysis</h1>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="network_activity">Network Activity</option>
            <option value="file_access">File Access</option>
            <option value="authentication">Authentication</option>
            <option value="data_transfer">Data Transfer</option>
            <option value="suspicious_activity">Suspicious Activity</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Events</h3>
          <div className="text-2xl font-bold">{filteredEvents.length}</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Critical Events</h3>
          <div className="text-2xl font-bold text-red-400">
            {filteredEvents.filter(e => e.severity === 'critical').length}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Warnings</h3>
          <div className="text-2xl font-bold text-yellow-400">
            {filteredEvents.filter(e => e.severity === 'warning').length}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Time Range</h3>
          <div className="text-sm">
            {Object.keys(groupedEvents).length > 0 ? (
              <span>{Object.keys(groupedEvents).length} day{Object.keys(groupedEvents).length !== 1 ? 's' : ''}</span>
            ) : (
              <span>No data</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Event Timeline</h2>
          <p className="text-sm text-gray-400 mt-1">
            Chronological view of system events and activities
          </p>
        </div>
        
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="p-8 text-center">
            <Timeline size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Timeline Events</h3>
            <p className="text-gray-400">
              Parse network traffic to generate timeline events.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {Object.entries(groupedEvents).map(([date, events]) => (
              <div key={date} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="ml-3 text-sm text-gray-400">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
                  
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div key={event.id} className="relative flex items-start">
                        <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getSeverityColor(event.severity)}`}>
                          {getSeverityIcon(event.severity)}
                        </div>
                        
                        <div className="ml-4 flex-1 bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{getTypeIcon(event.type)}</span>
                              <span className="font-medium">{event.description}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                              <button
                                onClick={() => setSelectedEvent(event.id)}
                                className="p-1 hover:bg-gray-700 rounded"
                                title="View Details"
                              >
                                <Eye size={14} className="text-gray-400" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-400 mb-2">
                            <span className="capitalize">{event.type.replace('_', ' ')}</span>
                            {event.source && event.destination && (
                              <span className="ml-2">
                                {event.source} → {event.destination}
                              </span>
                            )}
                          </div>
                          
                          {event.evidence && event.evidence.length > 0 && (
                            <div className="text-xs bg-gray-800 p-2 rounded font-mono">
                              {event.evidence[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Event Details Modal */}
      {selectedEventData && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Event Details</h3>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Event Information</h4>
                  <div className="bg-gray-900 p-4 rounded space-y-2 text-sm">
                    <p><span className="text-gray-400">ID:</span> {selectedEventData.id}</p>
                    <p><span className="text-gray-400">Timestamp:</span> {new Date(selectedEventData.timestamp).toLocaleString()}</p>
                    <p><span className="text-gray-400">Type:</span> {selectedEventData.type.replace('_', ' ')}</p>
                    <p><span className="text-gray-400">Severity:</span> {selectedEventData.severity}</p>
                    {selectedEventData.source && (
                      <p><span className="text-gray-400">Source:</span> {selectedEventData.source}</p>
                    )}
                    {selectedEventData.destination && (
                      <p><span className="text-gray-400">Destination:</span> {selectedEventData.destination}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <div className="bg-gray-900 p-4 rounded text-sm">
                    {selectedEventData.description}
                  </div>
                </div>
                
                {selectedEventData.evidence && selectedEventData.evidence.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Evidence</h4>
                    <div className="space-y-2">
                      {selectedEventData.evidence.map((evidence, index) => (
                        <div key={index} className="bg-gray-900 p-3 rounded">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                            {evidence}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;