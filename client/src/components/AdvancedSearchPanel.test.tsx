import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdvancedSearchPanel from './AdvancedSearchPanel';
import { savedSearchService } from '@/services/savedSearchService';

// Mock the savedSearchService
vi.mock('@/services/savedSearchService', () => ({
  savedSearchService: {
    getAllSavedSearches: vi.fn(),
    saveSearch: vi.fn(),
    loadSearch: vi.fn(),
    deleteSearch: vi.fn(),
  },
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock ResizeObserver for Radix UI
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock scrollIntoView for Radix UI
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock hasPointerCapture for Radix UI
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

describe('AdvancedSearchPanel', () => {
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return values
    (savedSearchService.getAllSavedSearches as any).mockReturnValue([]);

    // Mock window interactions
    // vi.spyOn(window, 'alert').mockImplementation(() => { }); // Removed alert usage
    // vi.spyOn(window, 'confirm').mockImplementation(() => true); // Removed confirm usage
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all search fields correctly', () => {
    render(
      <AdvancedSearchPanel onSearch={mockOnSearch} onClear={mockOnClear} />,
    );

    expect(screen.getByLabelText(/Source IP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination IP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source Port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination Port/i)).toBeInTheDocument();
    // Select trigger for Protocol
    expect(
      screen.getByRole('combobox', { name: /Protocol/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Range \(Start\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Range \(End\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payload Contains/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Case sensitive/i)).toBeInTheDocument();

    // Radio buttons for logic
    expect(screen.getByRole('radio', { name: 'AND' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'OR' })).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear All' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save Search' }),
    ).toBeInTheDocument();
  });

  it('allows entering criteria and submitting search', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchPanel onSearch={mockOnSearch} onClear={mockOnClear} />,
    );

    // Type into inputs
    await user.type(screen.getByLabelText(/Source IP/i), '192.168.1.100');
    await user.type(screen.getByLabelText(/Destination Port/i), '443');
    await user.type(screen.getByLabelText(/Payload Contains/i), 'error');

    // Select Protocol (Radix UI Select)
    const protocolTrigger = screen.getByRole('combobox', { name: /Protocol/i });
    await user.click(protocolTrigger);
    const tcpOption = await screen.findByRole('option', { name: 'TCP' });
    await user.click(tcpOption);

    // Toggle Case Sensitive
    await user.click(screen.getByLabelText(/Case sensitive/i));

    // Change Logic to OR
    await user.click(screen.getByRole('radio', { name: 'OR' }));

    // Submit
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceIp: { ip: '192.168.1.100', isCidr: false },
        destPort: { port: 443 },
        payload: { content: 'error', caseSensitive: true },
        protocol: { protocol: 'TCP' },
        logic: 'OR',
      }),
    );
  }, 10000);

  it('clears all fields when Clear All is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchPanel onSearch={mockOnSearch} onClear={mockOnClear} />,
    );

    // Enter some data
    fireEvent.change(screen.getByLabelText(/Source IP/i), {
      target: { value: '10.0.0.1' },
    });
    expect(screen.getByLabelText(/Source IP/i)).toHaveValue('10.0.0.1');

    // Click Clear
    await user.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(screen.getByLabelText(/Source IP/i)).toHaveValue('');
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('saves a new search configuration', async () => {
    const user = userEvent.setup();
    (savedSearchService.saveSearch as any).mockReturnValue(true);
    render(
      <AdvancedSearchPanel onSearch={mockOnSearch} onClear={mockOnClear} />,
    );

    // Enter data
    await user.type(screen.getByLabelText(/Source IP/i), '1.2.3.4');

    // Click Save Search
    await user.click(screen.getByRole('button', { name: 'Save Search' }));

    // Dialog should open
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    // Enter name in dialog
    const nameInput = screen.getByPlaceholderText('Search Name');
    await user.type(nameInput, 'Malicious IP');

    // Click Save in dialog
    const saveButton = within(dialog).getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(savedSearchService.saveSearch).toHaveBeenCalledWith(
      'Malicious IP',
      expect.objectContaining({
        sourceIp: { ip: '1.2.3.4', isCidr: false },
      }),
    );
    // Should reload saved searches
    expect(savedSearchService.getAllSavedSearches).toHaveBeenCalledTimes(2); // Once on mount, once after save
  });

  it('loads a saved search', async () => {
    const user = userEvent.setup();
    const mockCriteria = {
      sourceIp: { ip: '5.5.5.5', isCidr: false },
      logic: 'AND' as const,
    };

    (savedSearchService.getAllSavedSearches as any).mockReturnValue([
      { name: 'My Saved Search', criteria: mockCriteria },
    ]);
    (savedSearchService.loadSearch as any).mockReturnValue(mockCriteria);

    render(
      <AdvancedSearchPanel onSearch={mockOnSearch} onClear={mockOnClear} />,
    );

    // Open Load Saved dropdown
    await user.click(screen.getByRole('button', { name: /Load Saved/i }));

    // Click the saved search item
    const menuItem = await screen.findByText('My Saved Search');
    await user.click(menuItem);

    expect(savedSearchService.loadSearch).toHaveBeenCalledWith(
      'My Saved Search',
    );
    expect(screen.getByLabelText(/Source IP/i)).toHaveValue('5.5.5.5');
  });

  it('deletes a saved search', async () => {
    const user = userEvent.setup();
    (savedSearchService.getAllSavedSearches as any).mockReturnValue([
      { name: 'Search To Delete', criteria: {} },
    ]);

    render(
      <AdvancedSearchPanel onSearch={mockOnSearch} onClear={mockOnClear} />,
    );

    // Open Load Saved dropdown
    await user.click(screen.getByRole('button', { name: /Load Saved/i }));

    // Find and click Delete button for the item
    const deleteButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    // Expect AlertDialog to appear
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Are you sure you want to delete "Search To Delete"/i,
      ),
    ).toBeInTheDocument();

    // Click Delete in dialog
    const confirmDeleteButton = within(dialog).getByRole('button', {
      name: 'Delete',
    });
    await user.click(confirmDeleteButton);

    expect(savedSearchService.deleteSearch).toHaveBeenCalledWith(
      'Search To Delete',
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Search Deleted',
      }),
    );
    // Should reload saved searches
    expect(savedSearchService.getAllSavedSearches).toHaveBeenCalledTimes(2); // Once on mount, once after delete
  });
});
