// client/src/components/ThreatPanel.xss.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThreatPanel } from './ThreatPanel';
import type { ThreatAlert } from '../types/threat';

describe('ThreatPanel XSS Integration', () => {
    const xssThreat: ThreatAlert = {
        id: 'xss-threat-1',
        packetId: 'packet-1',
        severity: 'high',
        type: 'Cross-Site Scripting (XSS)',
        description: 'Potential XSS detected in query string (encoding: url)',
        mitreAttack: ['T1059.007'],
        timestamp: 1678886400000,
        falsePositive: false,
        confirmed: false,
        matchDetails: [{ offset: 10, length: 20 }],
    };

    it('renders XSS threat correctly', () => {
        render(
            <ThreatPanel
                threats={[xssThreat]}
                onThreatClick={vi.fn()}
                onUpdateThreatStatus={vi.fn()}
            />,
        );

        expect(screen.getByText(/Cross-Site Scripting \(XSS\)/)).toBeInTheDocument();
        expect(screen.getByText(/high/i)).toBeInTheDocument();
        expect(screen.getByText(/Potential XSS detected in query string/i)).toBeInTheDocument();
        expect(screen.getByText(/T1059.007/i)).toBeInTheDocument();
    });
});
