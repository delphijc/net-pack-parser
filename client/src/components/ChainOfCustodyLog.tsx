import React, { useEffect, useState } from 'react';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import type { ChainOfCustodyEvent } from '@/types';
import { History } from 'lucide-react';

const ChainOfCustodyLog: React.FC = () => {
  const [logEntries, setLogEntries] = useState<ChainOfCustodyEvent[]>([]);

  useEffect(() => {
    const fetchLogEntries = async () => {
      try {
        const entries = await chainOfCustodyDb.getAllEvents();
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
              <span className="text-blue-400 font-bold">[{entry.action}]</span> {entry.details}
            </p>
            <p className="text-xs text-gray-400">
              <span className="text-gray-600">Timestamp:</span>{' '}
              {new Date(entry.timestamp).toLocaleString()}
            </p>
            {entry.user && (
              <p className="text-xs text-gray-400">
                <span className="text-gray-600">User:</span> {entry.user}
              </p>
            )}
            {entry.hash && (
              <p className="text-xs text-gray-400 break-all">
                <span className="text-gray-600">Hash:</span> {entry.hash}
              </p>
            )}
            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <div className="mt-1 pl-2 border-l-2 border-gray-600">
                {Object.entries(entry.metadata).map(([key, value]) => (
                  <p key={key} className="text-xs text-gray-500 break-all">
                    <span className="capitalize">{key}:</span> {String(value)}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChainOfCustodyLog;
