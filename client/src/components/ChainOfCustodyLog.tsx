import React, { useEffect, useState } from 'react';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import type { FileChainOfCustodyEvent } from '@/types';
import { History } from 'lucide-react';

const ChainOfCustodyLog: React.FC = () => {
  const [logEntries, setLogEntries] = useState<FileChainOfCustodyEvent[]>([]);

  useEffect(() => {
    const fetchLogEntries = async () => {
      try {
        const entries = await chainOfCustodyDb.getAllFileChainOfCustodyEvents();
        setLogEntries(entries.reverse()); // Display newest first
      } catch (error) {
        console.error('Failed to fetch Chain of Custody log entries:', error);
      }
    };

    fetchLogEntries();
  }, []);

  if (logEntries.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <History size={20} className="mr-2 text-blue-400" />
        Chain of Custody Log
      </h3>
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
        {logEntries.map((entry) => (
          <div
            key={entry.id}
            className="border-b border-gray-700 pb-3 last:border-b-0"
          >
            <p className="text-sm font-medium text-gray-300">
              <span className="text-gray-500">Action:</span> {entry.action}
            </p>
            <p className="text-xs text-gray-400">
              <span className="text-gray-600">Timestamp:</span>{' '}
              {new Date(entry.timestamp).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              <span className="text-gray-600">Filename:</span> {entry.filename}{' '}
              (Size: {entry.fileSize} bytes)
            </p>
            <p className="text-xs text-gray-400 break-all">
              <span className="text-gray-600">SHA-256:</span> {entry.sha256Hash}
            </p>
            <p className="text-xs text-gray-400 break-all">
              <span className="text-gray-600">MD5:</span> {entry.md5Hash}
            </p>
            <p className="text-xs text-gray-400 break-all">
              <span className="text-gray-600">User Agent:</span>{' '}
              {entry.userAgent}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChainOfCustodyLog;
