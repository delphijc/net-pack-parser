// client/src/components/ThreatPanel.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThreatPanel } from './ThreatPanel';
import type { ThreatAlert } from '../types/threat';

describe('ThreatPanel', () => {
  const mockThreats: ThreatAlert[] = [
    {
      id: 'threat-1',
      packetId: 'packet-1',
      severity: 'critical',
      type: 'SQL Injection',
      description:
        'Potential SQL Injection detected in HTTP request (encoding: none)',
      mitreAttack: ['T1190'],
      timestamp: 1678886400000, // March 15, 2023 12:00:00 PM GMT
      falsePositive: false,
      confirmed: false,
      matchDetails: [{ offset: 20, length: 11 }],
    },
    {
      id: 'threat-2',
      packetId: 'packet-2',
      severity: 'critical',
      type: 'SQL Injection',
      description:
        'Potential SQL Injection detected in HTTP request (encoding: url)',
      mitreAttack: ['T1190'],
      timestamp: 1678886460000,
      falsePositive: true,
      confirmed: false,
      matchDetails: [{ offset: 25, length: 10 }],
    },
  ];

  it('renders "No threats detected." when no threats are provided', () => {
    render(
      <ThreatPanel
        threats={[]}
        onThreatClick={vi.fn()}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    expect(screen.getByText('No threats detected.')).toBeInTheDocument();
  });

  it('renders a list of threats when provided', () => {
    render(
      <ThreatPanel
        threats={mockThreats}
        onThreatClick={vi.fn()}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    // Debugging: Check if "No threats detected" is present
    const noThreats = screen.queryByText('No threats detected.');
    expect(noThreats).not.toBeInTheDocument();

    expect(screen.getAllByText(/SQL Injection/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/critical/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        /Potential SQL Injection detected in HTTP request \(encoding: none\)/i,
      ),
    ).toBeInTheDocument();
  });

  it('calls onThreatClick when a threat item is clicked', () => {
    const handleThreatClick = vi.fn();
    render(
      <ThreatPanel
        threats={mockThreats}
        onThreatClick={handleThreatClick}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByText(/SQL Injection/i)[0]);
    expect(handleThreatClick).toHaveBeenCalledWith('packet-1');
  });

  it('calls onUpdateThreatStatus with "falsePositive" when "Mark as False Positive" button is clicked', () => {
    const handleUpdateThreatStatus = vi.fn();
    render(
      <ThreatPanel
        threats={mockThreats}
        onThreatClick={vi.fn()}
        onUpdateThreatStatus={handleUpdateThreatStatus}
      />,
    );
    const falsePositiveButton = screen.getByRole('button', {
      name: /Mark as False Positive/i,
    });
    fireEvent.click(falsePositiveButton);
    expect(handleUpdateThreatStatus).toHaveBeenCalledWith(
      'threat-1',
      'falsePositive',
    );
  });

  it('calls onUpdateThreatStatus with "confirmed" when "Mark as Confirmed" button is clicked', () => {
    const handleUpdateThreatStatus = vi.fn();
    render(
      <ThreatPanel
        threats={mockThreats}
        onThreatClick={vi.fn()}
        onUpdateThreatStatus={handleUpdateThreatStatus}
      />,
    );
    const confirmedButtons = screen.getAllByRole('button', {
      name: /Mark as Confirmed/i,
    });
    fireEvent.click(confirmedButtons[0]);
    expect(handleUpdateThreatStatus).toHaveBeenCalledWith(
      'threat-1',
      'confirmed',
    );
  });

  it('disables "Mark as False Positive" button if threat is already falsePositive', () => {
    render(
      <ThreatPanel
        threats={mockThreats}
        onThreatClick={vi.fn()}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    const falsePositiveButton = screen.getByRole('button', {
      name: /False Positive \(Marked\)/i,
    });
    expect(falsePositiveButton).toBeDisabled();
  });

  it('disables "Mark as Confirmed" button if threat is already confirmed', () => {
    const confirmedThreats = [
      { ...mockThreats[0], confirmed: true },
      mockThreats[1],
    ];
    render(
      <ThreatPanel
        threats={confirmedThreats}
        onThreatClick={vi.fn()}
        onUpdateThreatStatus={vi.fn()}
      />,
    );
    const confirmedButton = screen.getByRole('button', {
      name: /Confirmed \(Marked\)/i,
    });
    expect(confirmedButton).toBeDisabled();
  });
});
