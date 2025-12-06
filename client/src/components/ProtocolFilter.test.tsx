// client/src/components/ProtocolFilter.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { vitest, describe, it, expect, beforeEach } from 'vitest';
import { ProtocolFilter } from './ProtocolFilter';

// Mock the shadcn/ui components used by ProtocolFilter
// We only need to mock the `Select` and `SelectItem` behavior for these tests.
vitest.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange: (val: string) => void;
    value?: string;
  }) => (
    <select
      data-testid="select-protocol-filter"
      onChange={(e) => onValueChange(e.target.value)}
      value={value}
    >
      {children}
    </select>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  // Mock other components just to avoid errors if they are used but not tested directly
  SelectTrigger: () => null, // Hide trigger to keep select valid
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ), // Render children directly (options)
}));

describe('ProtocolFilter', () => {
  const mockOnProtocolChange = vitest.fn();

  beforeEach(() => {
    mockOnProtocolChange.mockClear();
  });

  it('renders correctly with default "All Protocols" option', () => {
    render(
      <ProtocolFilter
        protocols={[]}
        selectedProtocol={undefined}
        onProtocolChange={mockOnProtocolChange}
      />,
    );

    expect(screen.getByTestId('select-protocol-filter')).toBeInTheDocument();
    expect(screen.getByText('All Protocols')).toBeInTheDocument();
    expect(screen.queryByText('HTTP')).not.toBeInTheDocument();
  });

  it('renders all provided protocols', () => {
    const testProtocols = ['HTTP', 'HTTPS', 'DNS'];
    render(
      <ProtocolFilter
        protocols={testProtocols}
        selectedProtocol={undefined}
        onProtocolChange={mockOnProtocolChange}
      />,
    );

    expect(screen.getByText('All Protocols')).toBeInTheDocument();
    expect(screen.getByText('HTTP')).toBeInTheDocument();
    expect(screen.getByText('HTTPS')).toBeInTheDocument();
    expect(screen.getByText('DNS')).toBeInTheDocument();
  });

  it('displays the selected protocol', () => {
    const testProtocols = ['HTTP', 'HTTPS'];
    render(
      <ProtocolFilter
        protocols={testProtocols}
        selectedProtocol="HTTPS"
        onProtocolChange={mockOnProtocolChange}
      />,
    );

    expect(screen.getByTestId('select-protocol-filter')).toHaveValue('HTTPS');
  });

  it('calls onProtocolChange with the new protocol when an item is selected', () => {
    const testProtocols = ['HTTP', 'HTTPS'];
    render(
      <ProtocolFilter
        protocols={testProtocols}
        selectedProtocol={undefined}
        onProtocolChange={mockOnProtocolChange}
      />,
    );

    const selectElement = screen.getByTestId('select-protocol-filter');
    fireEvent.change(selectElement, { target: { value: 'HTTP' } });

    expect(mockOnProtocolChange).toHaveBeenCalledTimes(1);
    expect(mockOnProtocolChange).toHaveBeenCalledWith('HTTP');
  });

  it('calls onProtocolChange with undefined when "All Protocols" is selected', () => {
    const testProtocols = ['HTTP'];
    render(
      <ProtocolFilter
        protocols={testProtocols}
        selectedProtocol="HTTP"
        onProtocolChange={mockOnProtocolChange}
      />,
    );

    const selectElement = screen.getByTestId('select-protocol-filter');
    fireEvent.change(selectElement, { target: { value: 'all' } });

    expect(mockOnProtocolChange).toHaveBeenCalledTimes(1);
    expect(mockOnProtocolChange).toHaveBeenCalledWith(undefined);
  });
});
