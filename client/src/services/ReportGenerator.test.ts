import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportGenerator } from './ReportGenerator';
import { useSessionStore } from '@/store/sessionStore';
import { useForensicStore } from '@/store/forensicStore';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';

// Mock dependencies
vi.mock('@/store/sessionStore');
vi.mock('@/store/forensicStore');
vi.mock('@/services/chainOfCustodyDb');

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    reportGenerator = new ReportGenerator();

    // Mock store state
    (useSessionStore as any).getState = vi.fn().mockReturnValue({
      activeSessionId: 'session-123',
      sessions: [
        {
          id: 'session-123',
          name: 'Test Case',
          timestamp: 1672531200000,
          packetCount: 500,
        },
      ],
    });

    (useForensicStore as any).getState = vi.fn().mockReturnValue({
      bookmarks: [
        {
          id: 'bm1',
          packetId: 'pkt1',
          note: 'Suspicious payload',
          timestamp: 1672531200000,
        },
      ],
      caseMetadata: {
        caseId: 'session-123',
        caseName: 'Test Case',
        investigator: 'Sherlock Holmes',
        organization: 'Scotland Yard',
        summary: 'Found evidence of Moriarty.',
        startDate: '2023-01-01',
      },
    });

    // Mock DB
    (chainOfCustodyDb.getAllEvents as any).mockResolvedValue([
      {
        id: 'evt1',
        action: 'FILE_UPLOAD',
        timestamp: '2023-01-01',
        details: 'test.pcap',
      },
    ]);
  });

  it('should generate report data structure correctly', async () => {
    const data = await reportGenerator.generateReportData();

    expect(data).toBeDefined();
    expect(data.metadata.caseId).toBe('session-123');
    expect(data.metadata.caseName).toBe('Test Case');
    expect(data.metadata.investigator).toBe('Sherlock Holmes');
    expect(data.metadata.organization).toBe('Scotland Yard');
    expect(data.metadata.summary).toBe('Found evidence of Moriarty.');
    expect(data.stats.packetCount).toBe(500);
    expect(data.bookmarks).toHaveLength(1);
    expect(data.chainOfCustody).toHaveLength(1);
  });

  it('should format HTML content', async () => {
    const data = await reportGenerator.generateReportData();
    const html = reportGenerator.generateHtml(data);

    expect(html).toContain('<h1>Forensic Report</h1>');
    expect(html).toContain('Test Case');
    expect(html).toContain('Sherlock Holmes');
    expect(html).toContain('Scotland Yard');
    expect(html).toContain('Found evidence of Moriarty.');
    expect(html).toContain('Suspicious payload');
    expect(html).toContain('FILE_UPLOAD');
  });
});
