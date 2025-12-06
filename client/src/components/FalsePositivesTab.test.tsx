import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FalsePositivesTab } from './FalsePositivesTab';
import type { ThreatAlert } from '../types/threat';
import { useAlertStore } from '../store/alertStore';

// Mock alertStore
vi.mock('../store/alertStore', () => ({
  useAlertStore: vi.fn(),
}));

describe('FalsePositivesTab', () => {
  const mockThreats: ThreatAlert[] = [
    {
      id: 'threat-1',
      packetId: 'packet-1',
      severity: 'critical',
      type: 'SQL Injection',
      description: 'Potential SQL Injection',
      mitreAttack: ['T1190'],
      timestamp: 1678886400000,
      destPort: 80,
      falsePositive: false,
      confirmed: false,
    },
  ];

  const mockRestoreAlert = vi.fn();
  const mockGetAlertState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAlertStore as any).mockReturnValue({
      restoreAlert: mockRestoreAlert,
      getAlertState: mockGetAlertState,
    });
  });

  it('renders "No false positives marked" when empty', () => {
    mockGetAlertState.mockReturnValue(undefined);
    render(<FalsePositivesTab threats={mockThreats} />);
    expect(screen.getByText('No false positives marked.')).toBeInTheDocument();
  });

  it('renders false positive threats', () => {
    mockGetAlertState.mockReturnValue({ status: 'false_positive' });
    render(<FalsePositivesTab threats={mockThreats} />);
    expect(screen.getByText('SQL Injection')).toBeInTheDocument();
  });

  it('calls restoreAlert when button is clicked', () => {
    mockGetAlertState.mockReturnValue({ status: 'false_positive' });
    render(<FalsePositivesTab threats={mockThreats} />);
    const button = screen.getByText('Restore to Dashboard');
    fireEvent.click(button);
    expect(mockRestoreAlert).toHaveBeenCalledWith('threat-1');
  });
});
