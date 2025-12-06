import React, { useState } from 'react';
import type { Flow } from '../utils/flowUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { ParsedPacket } from '../types';

interface FlowListProps {
  flows: Flow[];
  onPacketSelect: (packet: ParsedPacket | null) => void;
}

export const FlowList: React.FC<FlowListProps> = ({
  flows,
  onPacketSelect,
}) => {
  const [expandedFlowId, setExpandedFlowId] = useState<string | null>(null);

  const toggleFlow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFlowId(expandedFlowId === id ? null : id);
  };

  if (flows.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No flows found.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead className="text-right">Packets</TableHead>
            <TableHead className="text-right">Bytes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flows.map((flow) => (
            <React.Fragment key={flow.id}>
              <TableRow
                className={`cursor-pointer transition-colors ${
                  expandedFlowId === flow.id ? 'bg-accent/10' : ''
                }`}
                onClick={(e) => toggleFlow(flow.id, e)}
              >
                <TableCell className="p-2 text-center">
                  {expandedFlowId === flow.id ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {new Date(flow.startTime * 1000).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {flow.duration > 1000
                    ? `${(flow.duration / 1000).toFixed(2)}s`
                    : `${flow.duration.toFixed(2)}ms`}
                </TableCell>
                <TableCell className="font-mono text-xs text-blue-600 dark:text-blue-400">
                  {flow.sourceIp}:{flow.sourcePort}
                </TableCell>
                <TableCell className="font-mono text-xs text-purple-600 dark:text-purple-400">
                  {flow.destIp}:{flow.destPort}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {flow.protocol}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {flow.packetCount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {flow.totalBytes.toLocaleString()}
                </TableCell>
              </TableRow>
              {expandedFlowId === flow.id && (
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableCell colSpan={8} className="p-0">
                    <div className="p-4 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Packets in Flow ({flow.packetCount})
                      </div>
                      <div className="max-h-[300px] overflow-y-auto border rounded bg-card">
                        <Table>
                          <TableHeader>
                            <TableRow className="h-8">
                              <TableHead className="text-xs h-8">
                                Time
                              </TableHead>
                              <TableHead className="text-xs h-8">
                                Source
                              </TableHead>
                              <TableHead className="text-xs h-8">
                                Dest
                              </TableHead>
                              <TableHead className="text-xs h-8 text-right">
                                Len
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {flow.packets.map((pkt, idx) => (
                              <TableRow
                                key={idx}
                                className="h-8 hover:bg-accent/50 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPacketSelect(pkt);
                                }}
                              >
                                <TableCell className="font-mono text-[10px] py-1">
                                  {pkt.timestamp
                                    ? new Date(
                                        pkt.timestamp,
                                      ).toLocaleTimeString()
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className="font-mono text-[10px] py-1 text-blue-600 dark:text-blue-400">
                                  {pkt.sourceIP}:{pkt.sourcePort}
                                </TableCell>
                                <TableCell className="font-mono text-[10px] py-1 text-purple-600 dark:text-purple-400">
                                  {pkt.destIP}:{pkt.destPort}
                                </TableCell>
                                <TableCell className="font-mono text-[10px] py-1 text-right">
                                  {pkt.length}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
