
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
    const mockOnFilterChange = vi.fn();
    const mockOnClearFilter = vi.fn();

    const defaultProps = {
        onFilterChange: mockOnFilterChange,
        onClearFilter: mockOnClearFilter,
        packetCount: 100,
        totalPacketCount: 100,
    };

    it('renders correctly', () => {
        render(<FilterBar {...defaultProps} />);
        expect(screen.getByPlaceholderText(/Enter BPF filter/i)).toBeInTheDocument();
        expect(screen.getByText('Apply Filter')).toBeInTheDocument();
        expect(screen.getByText('Clear Filter')).toBeInTheDocument();
        expect(screen.getByText('Showing all 100 packets')).toBeInTheDocument();
    });

    it('handles input change and submission', () => {
        render(<FilterBar {...defaultProps} />);
        const input = screen.getByPlaceholderText(/Enter BPF filter/i);
        const submitBtn = screen.getByText('Apply Filter');

        fireEvent.change(input, { target: { value: 'tcp port 80' } });
        expect(input).toHaveValue('tcp port 80');

        fireEvent.click(submitBtn);
        expect(mockOnFilterChange).toHaveBeenCalledWith('tcp port 80');
    });

    it('handles clear filter', () => {
        render(<FilterBar {...defaultProps} />);
        const input = screen.getByPlaceholderText(/Enter BPF filter/i);
        const clearBtn = screen.getByText('Clear Filter');

        fireEvent.change(input, { target: { value: 'tcp port 80' } });
        fireEvent.click(clearBtn);

        expect(input).toHaveValue('');
        expect(mockOnClearFilter).toHaveBeenCalled();
    });

    it('displays error message when provided', () => {
        render(<FilterBar {...defaultProps} errorMessage="Invalid syntax" />);
        expect(screen.getByText('Invalid Filter')).toBeInTheDocument();
        expect(screen.getByText('Invalid syntax')).toBeInTheDocument();
    });

    it('displays filtered packet count', () => {
        render(<FilterBar {...defaultProps} packetCount={50} totalPacketCount={100} />);
        // Note: The component logic for displaying text depends on filterInput state, 
        // but the prop packetCount is passed. 
        // Let's check the component logic again.
        // {filterInput ? ... : ...}
        // So if I don't type anything, it shows "Showing all...".
        // If I type something, it shows "Showing X of Y...".

        // Let's simulate typing
        const input = screen.getByPlaceholderText(/Enter BPF filter/i);
        fireEvent.change(input, { target: { value: 'tcp' } });

        expect(screen.getByText('Showing 50 of 100 packets (filtered)')).toBeInTheDocument();
    });
});
