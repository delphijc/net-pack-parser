// client/src/components/PacketDetailView.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PacketDetailView from './PacketDetailView';
import type { ParsedPacket } from '@/types';
import type { MultiSearchCriteria } from '@/utils/multiCriteriaSearch';

// Mock the Sheet components
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => (open ? <div data-testid="sheet">{children}</div> : null),
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children }: any) => <div data-testid="sheet-title">{children}</div>,
  SheetDescription: ({ children }: any) => <div data-testid="sheet-description">{children}</div>,
}));

// Mock the other components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-value={value}>{children}</button>,
  TabsContent: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}));

vi.mock('@/components/HexDumpViewer', () => ({
  default: ({ highlightRanges }: any) => (
    <div data-testid="hex-dump-viewer" data-highlight-count={highlightRanges?.length || 0}>
      Hex Dump
    </div>
  ),
  generateHexDump: () => ({
    lines: [],
    fullAsciiDump: '',
  }),
}));

vi.mock('@/components/ExtractedStringsTab', () => ({
  default: () => <div data-testid="extracted-strings-tab">Extracted Strings</div>,
}));

vi.mock('@/components/FilesTab', () => ({
  default: () => <div data-testid="files-tab">Files</div>,
}));

vi.mock('@/utils/packetDecoder', () => ({
  decodePacketHeaders: () => [
    { name: 'Source IP', value: '192.168.1.1' },
    { name: 'Dest IP', value: '192.168.1.2' },
  ],
}));

describe('PacketDetailView Highlighting', () => {
  const createTestPacket = (overrides?: Partial<ParsedPacket>): ParsedPacket => ({
    id: 'test-1',
    timestamp: Date.now(),
    sourceIP: '192.168.1.1',
    destIP: '192.168.1.2',
    sourcePort: 80,
    destPort: 443,
    protocol: 'TCP',
    rawData: new TextEncoder().encode('test payload').buffer,
    detectedProtocols: ['HTTP'],
    ...overrides,
  });

  it('should highlight source IP when it matches search criteria', () => {
    const packet = createTestPacket();
    const searchCriteria: MultiSearchCriteria = {
      sourceIp: { ip: '192.168.1.1', isCidr: false },
      logic: 'AND',
    };

    const { container } = render(
      <PacketDetailView
        packet={packet}
        isOpen={true}
        onOpenChange={() => { }}
        searchCriteria={searchCriteria}
      />
    );

    // Find all elements containing the source IP and check if any are highlighted
    const highlighted = container.querySelectorAll('.bg-yellow-300');
    const sourceIPHighlighted = Array.from(highlighted).some(
      el => el.textContent?.includes('192.168.1.1')
    );
    expect(sourceIPHighlighted).toBe(true);
  });

  it('should highlight destination port when it matches search criteria', () => {
    const packet = createTestPacket();
    const searchCriteria: MultiSearchCriteria = {
      destPort: { port: 443 },
      logic: 'AND',
    };

    const { container } = render(
      <PacketDetailView
        packet={packet}
        isOpen={true}
        onOpenChange={() => { }}
        searchCriteria={searchCriteria}
      />
    );

    // Find all elements containing the dest port and check if any are highlighted
    const highlighted = container.querySelectorAll('.bg-yellow-300');
    const portHighlighted = Array.from(highlighted).some(
      el => el.textContent?.includes(':443')
    );
    expect(portHighlighted).toBe(true);
  });

  it('should highlight protocol when it matches search criteria', () => {
    const packet = createTestPacket();
    const searchCriteria: MultiSearchCriteria = {
      protocol: { protocol: 'HTTP' },
      logic: 'AND',
    };

    const { container } = render(
      <PacketDetailView
        packet={packet}
        isOpen={true}
        onOpenChange={() => { }}
        searchCriteria={searchCriteria}
      />
    );

    // Find the protocol field and check if it's highlighted
    const highlighted = container.querySelectorAll('.bg-yellow-300');
    const protocolHighlighted = Array.from(highlighted).some(
      el => el.textContent === 'TCP'
    );
    expect(protocolHighlighted).toBe(true);
  });

  it('should not highlight when search criteria do not match', () => {
    const packet = createTestPacket();
    const searchCriteria: MultiSearchCriteria = {
      sourceIp: { ip: '10.0.0.1', isCidr: false },
      logic: 'AND',
    };

    const { container } = render(
      <PacketDetailView
        packet={packet}
        isOpen={true}
        onOpenChange={() => { }}
        searchCriteria={searchCriteria}
      />
    );

    // Should have no highlighted IP addresses matching the source IP
    const highlighted = container.querySelectorAll('.bg-yellow-300');
    expect(highlighted.length).toBe(0);
  });

  it('should not render when packet is null', () => {
    render(
      <PacketDetailView
        packet={null}
        isOpen={true}
        onOpenChange={() => { }}
      />
    );

    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
  });
});