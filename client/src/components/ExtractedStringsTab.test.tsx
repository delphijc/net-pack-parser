import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExtractedStringsTab from './ExtractedStringsTab';
import type { ExtractedString } from '../types/extractedStrings';

// Mock shadcn/ui components
vi.mock('./ui/input', () => ({
    Input: ({ value, onChange, placeholder }: any) => (
        <input
            data-testid="mock-input"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    ),
}));

vi.mock('./ui/select', () => ({
    Select: ({ value, onValueChange, children }: any) => (
        <div data-testid="mock-select" data-value={value}>
            <select onChange={(e) => onValueChange(e.target.value)} value={value}>
                {/* We need to render children to get options, but Radix Select is complex.
            For simple testing, we can just mock the SelectContent and Items differently 
            or just expose a simple select for testing interactions.
        */}
                <option value="all">All Types</option>
                <option value="IP">IP Address</option>
                <option value="URL">URL</option>
                <option value="Email">Email Address</option>
                <option value="Credential">Credential</option>
                <option value="FilePath">File Path</option>
                <option value="Other">Other</option>
            </select>
            {children}
        </div>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: () => <span>Select Value</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('./ui/button', () => ({
    Button: ({ children, onClick }: any) => (
        <button onClick={onClick}>{children}</button>
    ),
}));

describe('ExtractedStringsTab', () => {
    const mockStrings: ExtractedString[] = [
        { id: '1', type: 'IP', value: '192.168.1.1', packetId: 'p1', payloadOffset: 10, length: 11 },
        { id: '2', type: 'URL', value: 'http://example.com', packetId: 'p1', payloadOffset: 50, length: 18 },
        { id: '3', type: 'Email', value: 'test@test.com', packetId: 'p1', payloadOffset: 100, length: 13 },
    ];

    const mockOnHighlight = vi.fn();

    it('renders "No strings extracted" when list is empty', () => {
        render(<ExtractedStringsTab extractedStrings={[]} onHighlight={mockOnHighlight} />);
        expect(screen.getByText('No strings extracted for this packet.')).toBeInTheDocument();
    });

    it('renders a list of extracted strings', () => {
        render(<ExtractedStringsTab extractedStrings={mockStrings} onHighlight={mockOnHighlight} />);

        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
        expect(screen.getByText('http://example.com')).toBeInTheDocument();
        expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });

    it('filters strings by search term', () => {
        render(<ExtractedStringsTab extractedStrings={mockStrings} onHighlight={mockOnHighlight} />);

        const input = screen.getByTestId('mock-input');
        fireEvent.change(input, { target: { value: 'example' } });

        expect(screen.queryByText('192.168.1.1')).not.toBeInTheDocument();
        expect(screen.getByText('http://example.com')).toBeInTheDocument();
    });

    it('filters strings by type', () => {
        render(<ExtractedStringsTab extractedStrings={mockStrings} onHighlight={mockOnHighlight} />);

        // Find the select element inside our mock
        const select = screen.getByRole('combobox'); // <select> has implicit role combobox
        fireEvent.change(select, { target: { value: 'IP' } });

        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
        expect(screen.queryByText('http://example.com')).not.toBeInTheDocument();
    });

    it('sorts strings by column', () => {
        render(<ExtractedStringsTab extractedStrings={mockStrings} onHighlight={mockOnHighlight} />);

        // Default sort is payloadOffset asc (10, 50, 100) -> IP, URL, Email
        // Let's sort by Value
        const valueHeader = screen.getByText('Value');
        fireEvent.click(valueHeader); // Ascending: http (h), test (t), 192 (1) ? No, 192 comes first in ASCII? 
        // '1' is 49, 'h' is 104. So 192... is first.
        // Wait, localeCompare: numbers vs letters.
        // '192.168.1.1'.localeCompare('http://example.com') -> usually numbers first or last depending on locale.
        // Let's check the order in the DOM.

        // const rows = screen.getAllByRole('row');
        // Row 0 is header. Rows 1, 2, 3 are data.
        // Initial: IP (10), URL (50), Email (100)

        // Click Value (Asc)
        // '192...' vs 'http...' vs 'test...'
        // Usually '1' < 'h' < 't'.
        // So order should be IP, URL, Email.

        // Click Value again (Desc)
        fireEvent.click(valueHeader);
        // Order: Email, URL, IP.

        const cells = screen.getAllByRole('cell');
        // First row cells: Type, Value, ...
        // We expect first data row to be Email
        expect(cells[0]).toHaveTextContent('Email');
        expect(cells[1]).toHaveTextContent('test@test.com');
    });

    it('calls onHighlight when a row is clicked', () => {
        render(<ExtractedStringsTab extractedStrings={mockStrings} onHighlight={mockOnHighlight} />);

        const ipRow = screen.getByText('192.168.1.1').closest('tr');
        expect(ipRow).toBeInTheDocument();

        if (ipRow) {
            fireEvent.click(ipRow);
            expect(mockOnHighlight).toHaveBeenCalledWith(10, 11);
        }
    });
});
