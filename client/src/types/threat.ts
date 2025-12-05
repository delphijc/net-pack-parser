export interface ThreatAlert {
  id: string;
  packetId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  description: string;
  mitreAttack: string[];
  timestamp: number;
  falsePositive: boolean;
  confirmed: boolean;
  matchDetails?: { offset: number; length: number }[]; // Added for highlighting
  sensitiveData?: string; // Raw sensitive data for reveal functionality
  sourceIp?: string;
  destIp?: string;
  source?: string; // IOC Source
  sourcePort?: number;
  destPort: number;
  status?: 'active' | 'false_positive' | 'confirmed';
  notes?: string[];
}
