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
  sourceIp?: string;
  destIp?: string;
}
