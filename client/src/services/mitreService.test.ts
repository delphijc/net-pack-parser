import { describe, it, expect } from 'vitest';
import { mitreService } from './mitreService';
import type { ThreatAlert } from '../types/threat';

describe('mitreService', () => {
  it('should retrieve technique details by ID', () => {
    const technique = mitreService.getTechniqueDetails('T1190');
    expect(technique).toBeDefined();
    expect(technique?.name).toBe('Exploit Public-Facing Application');
    expect(technique?.tactic).toBe('Initial Access');
  });

  it('should return undefined for unknown IDs', () => {
    const technique = mitreService.getTechniqueDetails('INVALID_ID');
    expect(technique).toBeUndefined();
  });

  it('should return all techniques', () => {
    const techniques = mitreService.getAllTechniques();
    expect(techniques.length).toBeGreaterThan(0);
  });

  it('should calculate tactics distribution correctly', () => {
    const mockThreats: ThreatAlert[] = [
      {
        id: '1',
        packetId: 'p1',
        severity: 'high',
        type: 'Exploit',
        description: 'Test',
        mitreAttack: ['T1190'], // Initial Access
        timestamp: 123,
        falsePositive: false,
        confirmed: false,
        destPort: 80,
      },
      {
        id: '2',
        packetId: 'p2',
        severity: 'medium',
        type: 'XSS',
        description: 'Test',
        mitreAttack: ['T1059.007'], // Execution
        timestamp: 123,
        falsePositive: false,
        confirmed: false,
        destPort: 80,
      },
      {
        id: '3',
        packetId: 'p3',
        severity: 'high',
        type: 'Exploit',
        description: 'Test',
        mitreAttack: ['T1190'], // Initial Access
        timestamp: 123,
        falsePositive: false,
        confirmed: false,
        destPort: 80,
      },
    ];

    const distribution = mitreService.getTacticsDistribution(mockThreats);
    expect(distribution['Initial Access']).toBe(2);
    expect(distribution['Execution']).toBe(1);
  });

  it('should get top techniques correctly', () => {
    const mockThreats: ThreatAlert[] = [
      {
        id: '1',
        packetId: 'p1',
        severity: 'high',
        type: 'Exploit',
        description: 'Test',
        mitreAttack: ['T1190'],
        timestamp: 123,
        falsePositive: false,
        confirmed: false,
        destPort: 80,
      },
      {
        id: '2',
        packetId: 'p2',
        severity: 'high',
        type: 'Exploit',
        description: 'Test',
        mitreAttack: ['T1190'],
        timestamp: 123,
        falsePositive: false,
        confirmed: false,
        destPort: 80,
      },
      {
        id: '3',
        packetId: 'p3',
        severity: 'medium',
        type: 'XSS',
        description: 'Test',
        mitreAttack: ['T1059.007'],
        timestamp: 123,
        falsePositive: false,
        confirmed: false,
        destPort: 80,
      },
    ];

    const top = mitreService.getTopTechniques(mockThreats, 5);
    expect(top[0].technique.id).toBe('T1190');
    expect(top[0].count).toBe(2);
    expect(top[1].technique.id).toBe('T1059.007');
    expect(top[1].count).toBe(1);
  });
});
