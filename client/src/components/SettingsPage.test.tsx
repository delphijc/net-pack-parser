// src/components/SettingsPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import { localStorageService } from '@/services/localStorage';
import { Toaster } from '@/components/ui/toaster';

// Mock the localStorageService
vi.mock('@/services/localStorage', () => ({
  localStorageService: {
    getUsagePercentage: vi.fn(() => 0),
    onQuotaExceeded: vi.fn(() => () => {}), // Return a dummy unsubscribe function
    clearAll: vi.fn(),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the settings page with storage usage', () => {
    (localStorageService.getUsagePercentage as vi.Mock).mockReturnValue(15);
    render(<>
        <SettingsPage />
        <Toaster />
    </>);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Local Storage')).toBeInTheDocument();
    expect(screen.getByText('15.00% used')).toBeInTheDocument();
  });

  it('shows a confirmation dialog when "Clear All Local Data" is clicked', async () => {
    render(<>
        <SettingsPage />
        <Toaster />
    </>);
    
    const user = userEvent.setup();
    const clearButton = screen.getByRole('button', { name: /Clear All Local Data/i });
    await user.click(clearButton);

    expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
  });

  it('calls clearAll when confirmation is accepted', async () => {
    render(<>
        <SettingsPage />
        <Toaster />
    </>);
    const user = userEvent.setup();
    const clearButton = screen.getByRole('button', { name: /Clear All Local Data/i });
    await user.click(clearButton);

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(continueButton);

    expect(localStorageService.clearAll).toHaveBeenCalled();
  });
});
