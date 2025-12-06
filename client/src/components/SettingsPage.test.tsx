import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import { localStorageService } from '@/services/localStorage';
import { exportDataAsJson, importDataFromJson } from '@/utils/dataImportExport';

import database from '@/services/database';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';

// Mock the localStorageService
vi.mock('@/services/localStorage', () => ({
  localStorageService: {
    getUsagePercentage: vi.fn(() => 0),
    onQuotaExceeded: vi.fn(() => () => {}),
    clearAll: vi.fn(),
    getValue: vi.fn(() => null),
    setValue: vi.fn(),
  },
}));

// Mock database and chainOfCustodyDb
vi.mock('@/services/database', () => ({
  default: {
    clearAllData: vi.fn().mockResolvedValue(undefined),
    clearPerformanceEntries: vi.fn(),
  },
}));

vi.mock('@/services/chainOfCustodyDb', () => ({
  default: {
    clearAll: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock dataImportExport utils
vi.mock('@/utils/dataImportExport', () => ({
  exportDataAsJson: vi.fn(),
  importDataFromJson: vi.fn(),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock usePerformanceStore
vi.mock('@/store/performanceStore', () => ({
  usePerformanceStore: {
    getState: () => ({
      resetMetrics: vi.fn(),
    }),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the settings page with storage usage', () => {
    (localStorageService.getUsagePercentage as Mock).mockReturnValue(15);
    render(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Local Storage')).toBeInTheDocument();
    expect(screen.getByText('15.00% used')).toBeInTheDocument();
  });

  it('shows a confirmation dialog when "Clear Analysis Data" is clicked', async () => {
    render(<SettingsPage />);

    const user = userEvent.setup();
    const clearButton = screen.getByRole('button', {
      name: /Clear Analysis Data/i,
    });
    await user.click(clearButton);

    expect(screen.getByText('Clear Analysis Data?')).toBeInTheDocument();
  });

  it('calls clearAllData when confirmation is accepted', async () => {
    render(<SettingsPage />);
    const user = userEvent.setup();
    const clearButton = screen.getByRole('button', {
      name: /Clear Analysis Data/i,
    });
    await user.click(clearButton);

    const continueButton = screen.getByRole('button', { name: /Clear Data/i });
    await user.click(continueButton);

    await waitFor(() => {
      expect(database.clearAllData).toHaveBeenCalled();
      expect(chainOfCustodyDb.clearAll).toHaveBeenCalled();
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Success',
        description:
          'Analysis data (Packets, Files, Logs) cleared successfully.',
      }),
    );
  });

  it('triggers export when "Export Data" is clicked', async () => {
    render(<SettingsPage />);
    const user = userEvent.setup();
    const exportButton = screen.getByRole('button', { name: /Export Data/i });

    await user.click(exportButton);

    expect(exportDataAsJson).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export Started',
      }),
    );
  });

  it('opens confirmation dialog when a file is selected for import', async () => {
    const { container } = render(<SettingsPage />);
    const user = userEvent.setup();

    const file = new File(['{"metadata":{},"data":{}}'], 'backup.json', {
      type: 'application/json',
    });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, file);

    expect(await screen.findByText('Choose Import Mode')).toBeInTheDocument();
  });

  it('calls importDataFromJson with "merge" mode when Merge is clicked', async () => {
    (importDataFromJson as Mock).mockReturnValue({
      success: true,
      message: 'Imported 5 items',
      importedCount: 5,
    });
    const { container } = render(<SettingsPage />);
    const user = userEvent.setup();

    const file = new File(['{"metadata":{},"data":{}}'], 'backup.json', {
      type: 'application/json',
    });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    const mergeButton = await screen.findByRole('button', { name: /Merge/i });
    await user.click(mergeButton);

    expect(importDataFromJson).toHaveBeenCalledWith(
      expect.any(String),
      'merge',
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import Successful',
        description: 'Imported 5 items',
      }),
    );
  });

  it('calls importDataFromJson with "replace" mode when Replace is clicked', async () => {
    (importDataFromJson as Mock).mockReturnValue({
      success: true,
      message: 'Replaced all data',
      importedCount: 10,
    });
    const { container } = render(<SettingsPage />);
    const user = userEvent.setup();

    const file = new File(['{"metadata":{},"data":{}}'], 'backup.json', {
      type: 'application/json',
    });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    const replaceButton = await screen.findByRole('button', {
      name: /Replace/i,
    });
    await user.click(replaceButton);

    expect(importDataFromJson).toHaveBeenCalledWith(
      expect.any(String),
      'replace',
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import Successful',
        description: 'Replaced all data',
      }),
    );
  });

  it('displays error toast when import fails', async () => {
    (importDataFromJson as Mock).mockReturnValue({
      success: false,
      message: 'Invalid format',
      importedCount: 0,
    });
    const { container } = render(<SettingsPage />);
    const user = userEvent.setup();

    const file = new File(['invalid'], 'backup.json', {
      type: 'application/json',
    });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    const mergeButton = await screen.findByRole('button', { name: /Merge/i });
    await user.click(mergeButton);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import Failed',
        description: 'Invalid format',
        variant: 'destructive',
      }),
    );
  });
});
