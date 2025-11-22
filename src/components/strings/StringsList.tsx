import React, { useState, useMemo } from 'react';
import { Search, ArrowDown, ArrowUp, Text, FileText } from 'lucide-react';
import database from '../../services/database';

const StringsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'value' | 'count'>('count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const packets = database.getAllPackets();

  const stringStats = useMemo(() => {
    const stats = new Map<string, { count: number, packets: Set<string> }>();

    packets.forEach(packet => {
      packet.tokens
        .filter(token => token.type === 'string')
        .forEach(token => {
          if (!stats.has(token.value)) {
            stats.set(token.value, { count: 0, packets: new Set() });
          }
          const stat = stats.get(token.value)!;
          stat.count++;
          stat.packets.add(packet.id);
        });
    });

    return Array.from(stats.entries()).map(([value, { count, packets }]) => ({
      value,
      count,
      packetCount: packets.size
    }));
  }, [packets]);

  const filteredAndSortedStrings = useMemo(() => {
    return stringStats
      .filter(str =>
        str.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = sortField === 'value' ? a.value : a.count;
        const bValue = sortField === 'value' ? b.value : b.count;
        return sortDirection === 'asc'
          ? aValue > bValue ? 1 : -1
          : bValue > aValue ? 1 : -1;
      });
  }, [stringStats, searchQuery, sortField, sortDirection]);

  const handleSort = (field: 'value' | 'count') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'value' | 'count' }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Parsed Strings</h2>

      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search strings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => handleSort('value')}
                  >
                    <span className="mr-1">String</span>
                    <SortIcon field="value" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => handleSort('count')}
                  >
                    <span className="mr-1">Occurrences</span>
                    <SortIcon field="count" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Packets
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAndSortedStrings.map((str) => (
                <tr key={str.value} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Text size={16} className="text-purple-400 mr-2 flex-shrink-0" />
                      <code className="text-sm bg-gray-900 px-2 py-0.5 rounded break-all">
                        {str.value}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-900 text-purple-200 rounded-full">
                      {str.count}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-400">
                      <FileText size={16} className="mr-2" />
                      {str.packetCount} packet{str.packetCount !== 1 ? 's' : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StringsList;