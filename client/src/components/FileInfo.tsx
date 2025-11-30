import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface FileInfoProps {
  fileName: string;
  fileSize: number;
  sha256Hash: string;
  md5Hash: string;
  onVerifyIntegrity: () => Promise<{ sha256Match: boolean; md5Match: boolean }>;
}

const FileInfo: React.FC<FileInfoProps> = ({
  fileName,
  fileSize,
  sha256Hash,
  md5Hash,
  onVerifyIntegrity,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'verified_match' | 'verified_mismatch' | 'error'
  >('idle');
  const [sha256Verified, setSha256Verified] = useState<boolean | null>(null);
  const [md5Verified, setMd5Verified] = useState<boolean | null>(null);

  const handleVerify = async () => {
    setVerificationStatus('verifying');
    try {
      const result = await onVerifyIntegrity();
      setSha256Verified(result.sha256Match);
      setMd5Verified(result.md5Match);
      if (result.sha256Match && result.md5Match) {
        setVerificationStatus('verified_match');
      } else {
        setVerificationStatus('verified_mismatch');
      }
    } catch (error) {
      console.error('Error during integrity verification:', error);
      setVerificationStatus('error');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">File Information</h3>
      <div className="space-y-2">
        <p className="text-sm">
          <span className="text-gray-400">File Name:</span>{' '}
          <span className="font-mono text-blue-300">{fileName}</span>
        </p>
        <p className="text-sm">
          <span className="text-gray-400">File Size:</span>{' '}
          <span className="font-mono text-blue-300">{fileSize} bytes</span>
        </p>
        <p className="text-sm flex items-center">
          <span className="text-gray-400">SHA-256:</span>{' '}
          <span className="font-mono text-green-300 break-all mr-2">
            {sha256Hash}
          </span>
          {sha256Verified !== null &&
            (sha256Verified ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-red-500" />
            ))}
        </p>
        <p className="text-sm flex items-center">
          <span className="text-gray-400">MD5:</span>{' '}
          <span className="font-mono text-yellow-300 break-all mr-2">
            {md5Hash}
          </span>
          {md5Verified !== null &&
            (md5Verified ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-red-500" />
            ))}
        </p>
        <div className="pt-2">
          <button
            onClick={handleVerify}
            disabled={verificationStatus === 'verifying'}
            className={`px-4 py-2 rounded-md text-sm flex items-center ${
              verificationStatus === 'verifying'
                ? 'bg-blue-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {verificationStatus === 'verifying' && (
              <RefreshCw size={14} className="mr-2 animate-spin" />
            )}
            {verificationStatus === 'idle' && 'Verify Integrity'}
            {verificationStatus === 'verifying' && 'Verifying...'}
            {verificationStatus === 'verified_match' && 'Integrity Verified'}
            {verificationStatus === 'verified_mismatch' && 'Mismatch Detected!'}
            {verificationStatus === 'error' && 'Verification Error'}
          </button>
          {verificationStatus === 'verified_match' && (
            <span className="ml-2 text-green-500">
              ✓ File integrity verified!
            </span>
          )}
          {verificationStatus === 'verified_mismatch' && (
            <span className="ml-2 text-red-500">✗ Hash mismatch detected!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileInfo;
