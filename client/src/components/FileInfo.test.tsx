import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileInfo from './FileInfo';

describe('FileInfo', () => {
  const mockFileInfoProps = {
    fileName: 'test.pcap',
    fileSize: 12345,
    sha256Hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    md5Hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
  };

  it('should display file information correctly', () => {
    const mockOnVerifyIntegrity = vi.fn(() => Promise.resolve({ sha256Match: true, md5Match: true }));
    render(<FileInfo {...mockFileInfoProps} onVerifyIntegrity={mockOnVerifyIntegrity} />);

    expect(screen.getByText(/File Name:/i)).toBeInTheDocument();
    expect(screen.getByText(mockFileInfoProps.fileName)).toBeInTheDocument();
    expect(screen.getByText(/File Size:/i)).toBeInTheDocument();
    expect(screen.getByText(`${mockFileInfoProps.fileSize} bytes`)).toBeInTheDocument();
    expect(screen.getByText(/SHA-256:/i)).toBeInTheDocument();
    expect(screen.getByText(mockFileInfoProps.sha256Hash)).toBeInTheDocument();
    expect(screen.getByText(/MD5:/i)).toBeInTheDocument();
    expect(screen.getByText(mockFileInfoProps.md5Hash)).toBeInTheDocument();
  });

  it('should call onVerifyIntegrity when the button is clicked', async () => {
    const mockOnVerifyIntegrity = vi.fn(() => Promise.resolve({ sha256Match: true, md5Match: true }));
    render(<FileInfo {...mockFileInfoProps} onVerifyIntegrity={mockOnVerifyIntegrity} />);

    const verifyButton = screen.getByRole('button', { name: /Verify Integrity/i });
    fireEvent.click(verifyButton);

    expect(verifyButton).toHaveTextContent(/Verifying.../i);

    await waitFor(() => {
      expect(mockOnVerifyIntegrity).toHaveBeenCalledTimes(1);
    });

    expect(verifyButton).toHaveTextContent(/Integrity Verified/i);
    expect(screen.getByText(/✓ File integrity verified!/i)).toBeInTheDocument();
  });

  it('should display "Mismatch Detected!" when hashes do not match', async () => {
    const mockOnVerifyIntegrity = vi.fn(() => Promise.resolve({ sha256Match: false, md5Match: true })); // Only SHA-256 mismatches
    render(<FileInfo {...mockFileInfoProps} onVerifyIntegrity={mockOnVerifyIntegrity} />);

    const verifyButton = screen.getByRole('button', { name: /Verify Integrity/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockOnVerifyIntegrity).toHaveBeenCalledTimes(1);
    });

    expect(verifyButton).toHaveTextContent(/Mismatch Detected!/i);
    expect(screen.getByText(/✗ Hash mismatch detected!/i)).toBeInTheDocument();
  });

  it('should display "Verification Error" on API failure', async () => {
    const mockOnVerifyIntegrity = vi.fn(() => Promise.reject(new Error('Test error')));
    render(<FileInfo {...mockFileInfoProps} onVerifyIntegrity={mockOnVerifyIntegrity} />);

    const verifyButton = screen.getByRole('button', { name: /Verify Integrity/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockOnVerifyIntegrity).toHaveBeenCalledTimes(1);
    });

    expect(verifyButton).toHaveTextContent(/Verification Error/i);
  });
});
