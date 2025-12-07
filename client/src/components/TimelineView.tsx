import React, { useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ParsedPacket } from '../types';
import { TimelineChart } from './TimelineChart';
import { generateTimelineData } from '../utils/timelineUtils';
import { useTimelineStore } from '../store/timelineStore';
import { useAuditLogger } from '../hooks/useAuditLogger';
import { useForensicStore } from '../store/forensicStore';
import { AnnotationPanel } from './AnnotationPanel';
import { TimelineControls } from './TimelineControls';

interface TimelineViewProps {
  packets: ParsedPacket[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ packets }) => {
  const {
    startTime,
    endTime,
    setRange,
    resetRange,
    showThreatsOnly,
    selectedProtocol,
  } = useTimelineStore();
  const { bookmarks, addBookmark } = useForensicStore();

  const timelineData = useMemo(() => {
    let filtered = packets;

    // Apply filters
    if (showThreatsOnly) {
      filtered = filtered.filter(
        (p) =>
          (p.suspiciousIndicators && p.suspiciousIndicators.length > 0) ||
          (p.threatIntelligence && p.threatIntelligence.length > 0),
      );
    }

    if (selectedProtocol) {
      filtered = filtered.filter(
        (p) =>
          p.protocol === selectedProtocol ||
          p.detectedProtocols?.includes(selectedProtocol),
      );
    }

    return generateTimelineData(filtered);
  }, [packets, showThreatsOnly, selectedProtocol]);

  // Calculate indices based on store timestamps
  const startIndex = useMemo(() => {
    if (startTime === null) return undefined;
    const idx = timelineData.findIndex((d) => d.timestamp >= startTime);
    return idx !== -1 ? idx : 0;
  }, [timelineData, startTime]);

  const endIndex = useMemo(() => {
    if (endTime === null) return undefined;
    let idx = -1;
    for (let i = timelineData.length - 1; i >= 0; i--) {
      if (timelineData[i].timestamp <= endTime) {
        idx = i;
        break;
      }
    }
    return idx !== -1 ? idx : timelineData.length - 1;
  }, [timelineData, endTime]);

  const handleRangeChange = (start: number | null, end: number | null) => {
    setRange(start, end);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (timelineData.length === 0) return;

    let currentStartIdx = startIndex ?? 0;
    let currentEndIdx = endIndex ?? timelineData.length - 1;

    const range = currentEndIdx - currentStartIdx;
    const step = Math.max(1, Math.floor(range * 0.2)); // 20% zoom

    if (direction === 'in') {
      currentStartIdx = Math.min(currentStartIdx + step, currentEndIdx - 2); // Keep at least 2 bars
      currentEndIdx = Math.max(currentEndIdx - step, currentStartIdx + 2);
    } else {
      currentStartIdx = Math.max(0, currentStartIdx - step);
      currentEndIdx = Math.min(timelineData.length - 1, currentEndIdx + step);
    }

    const newStartTime = timelineData[currentStartIdx].timestamp;
    const newEndTime = timelineData[currentEndIdx].timestamp;
    setRange(newStartTime, newEndTime);
  };

  const { logAction } = useAuditLogger();

  const handlePlotClick = (timestamp: number) => {
    addBookmark({
      id: crypto.randomUUID(), // Use naive UUID for now
      timestamp,
      label: 'New Bookmark',
      note: 'Enter note here...',
      author: 'Analyst',
    });
    logAction(
      'ANNOTATE',
      `Created bookmark at ${new Date(timestamp).toLocaleString()}`,
    );
  };

  return (
    <div className="space-y-4 h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-lg font-medium">Timeline Analysis</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            {packets.length} packets / {timelineData.length} intervals
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleZoom('in')}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleZoom('out')}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={resetRange}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TimelineControls />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        <div className="lg:col-span-3 rounded-xl border bg-card text-card-foreground shadow flex flex-col overflow-hidden">
          <div className="p-6 h-full">
            <TimelineChart
              data={timelineData}
              startIndex={startIndex}
              endIndex={endIndex}
              onRangeChange={handleRangeChange}
              bookmarks={bookmarks}
              onPlotClick={handlePlotClick}
            />
          </div>
        </div>

        <div className="lg:col-span-1 min-h-0 overflow-hidden">
          <AnnotationPanel />
        </div>
      </div>
    </div>
  );
};
