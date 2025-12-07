import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvidencePackager } from './EvidencePackager';
import { useSessionStore } from '@/store/sessionStore';
import { useForensicStore } from '@/store/forensicStore';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import JSZip from 'jszip';

// Mock content
const mockFile = vi.fn();
const mockGenerateAsync = vi
  .fn()
  .mockResolvedValue(new Blob(['mock-zip-content']));

vi.mock('jszip', () => {
  return {
    default: class {
      file = mockFile;
      generateAsync = mockGenerateAsync;
    },
  };
});

// Mock dependencies
vi.mock('@/services/chainOfCustodyDb');
vi.mock('@/utils/hashGenerator', () => ({
  generateSha256Hash: vi.fn().mockResolvedValue('mock-hash-1234567890abcdef'),
}));

// Mock browser APIs
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();
// Mock Blob.arrayBuffer for JSDOM
Blob.prototype.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

describe('EvidencePackager', () => {
  let packager: EvidencePackager;

  beforeEach(() => {
    vi.clearAllMocks();
    packager = new EvidencePackager();

    // Explicitly reset our external mock functions if needed (spies usually keep history unless cleared)
    mockFile.mockClear();
    mockGenerateAsync.mockClear();
    mockGenerateAsync.mockResolvedValue(new Blob(['mock-zip-content']));

    // Reset store state
    useSessionStore.setState({
      sessions: [
        {
          id: 'session-1',
          name: 'Test Session',
          timestamp: 1234567890,
          packetCount: 100,
        },
      ],
      activeSessionId: 'session-1',
    });

    useForensicStore.setState({
      bookmarks: [
        { id: 'bm-1', packetId: 'pkg-1', note: 'test note', timestamp: 12345 },
      ],
      caseMetadata: {
        caseId: 'session-1',
        caseName: 'Investigation Zulu',
        investigator: 'Agent Smith',
        organization: 'Matrix Defense',
        summary: 'Anomaly detected.',
        startDate: '2023-01-01',
      },
    });

    // Mock DB response
    (chainOfCustodyDb.getAllEvents as any).mockResolvedValue([
      { id: 'evt-1', action: 'TEST_ACTION', timestamp: '2023-01-01' },
    ]);

    // Mock DOM
    document.createElement = vi.fn().mockReturnValue({
      click: vi.fn(),
      href: '',
      download: '',
    } as any);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('should generate a zip package with all required files', async () => {
    const mockBlob = new Blob(['mock-pcap-data']);
    const filename = 'test.pcap';

    const hash = await packager.exportPackage(mockBlob, filename);

    // Verify ZIP content
    expect(mockFile).toHaveBeenCalledWith('evidence.pcap', mockBlob);
    expect(mockFile).toHaveBeenCalledWith(
      'case-metadata.json',
      expect.stringContaining('Investigation Zulu'),
    );
    expect(mockFile).toHaveBeenCalledWith(
      'case-metadata.json',
      expect.stringContaining('Agent Smith'),
    );
    expect(mockFile).toHaveBeenCalledWith(
      'case-metadata.json',
      expect.stringContaining('Matrix Defense'),
    );
    expect(mockFile).toHaveBeenCalledWith(
      'chain-of-custody.json',
      expect.stringContaining('TEST_ACTION'),
    );
    expect(mockFile).toHaveBeenCalledWith(
      'annotations.json',
      expect.stringContaining('test note'),
    );

    // Verify Hashing
    expect(hash).toBe('mock-hash-1234567890abcdef');
  });

  it('should handle missing session gracefully', async () => {
    useSessionStore.setState({ activeSessionId: 'non-existent' });
    const mockBlob = new Blob(['mock-pcap-data']);

    await packager.exportPackage(mockBlob, 'test.pcap');

    expect(mockFile).toHaveBeenCalledWith(
      'case-metadata.json',
      expect.stringContaining('unknown'),
    );
  });
});
