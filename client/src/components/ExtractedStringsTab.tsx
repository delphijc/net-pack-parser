import React, { useState, useMemo } from 'react';
import type { ExtractedString, ExtractedStringType } from '../types/extractedStrings';
import { Input } from './ui/input'; // Assuming shadcn/ui Input is available
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; // Assuming shadcn/ui Select is available
import { ArrowUpDown } from 'lucide-react'; // Assuming lucide-react for sort icon

import { cn } from '@/lib/utils'; // Assuming cn for utility classes

interface ExtractedStringsTabProps {
  extractedStrings: ExtractedString[];
  onHighlight: (offset: number, length: number) => void; // New prop for highlighting
}

type SortColumn = keyof ExtractedString | null;
type SortDirection = 'asc' | 'desc';

const ExtractedStringsTab: React.FC<ExtractedStringsTabProps> = ({ extractedStrings, onHighlight }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ExtractedStringType | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('payloadOffset');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredStrings = useMemo(() => {
    let filtered = extractedStrings.filter(str =>
      str.value.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || str.type === filterType)
    );

    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    return filtered;
  }, [extractedStrings, searchTerm, filterType, sortColumn, sortDirection]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Extracted Strings</h3>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search strings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterType} onValueChange={(value: ExtractedStringType | 'all') => setFilterType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IP">IP Address</SelectItem>
            <SelectItem value="URL">URL</SelectItem>
            <SelectItem value="Email">Email Address</SelectItem>
            <SelectItem value="Credential">Credential</SelectItem>
            <SelectItem value="FilePath">File Path</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {extractedStrings.length === 0 ? (
        <p className="text-gray-500">No strings extracted for this packet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeadWithSort
                  column="type"
                  label="Type"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableHeadWithSort
                  column="value"
                  label="Value"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableHeadWithSort
                  column="packetId"
                  label="Packet ID"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableHeadWithSort
                  column="payloadOffset"
                  label="Offset"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableHeadWithSort
                  column="length"
                  label="Length"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredStrings.map((str) => (
                <tr
                  key={str.id}
                  className="hover:bg-gray-50 cursor-pointer" // Added cursor-pointer for visual cue
                  onClick={() => onHighlight(str.payloadOffset, str.length)} // Click handler
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{str.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{str.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{str.packetId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{str.payloadOffset}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{str.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface TableHeadWithSortProps {
  column: SortColumn;
  label: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

const TableHeadWithSort: React.FC<TableHeadWithSortProps> = ({ column, label, sortColumn, sortDirection, onSort }) => (
  <th
    scope="col"
    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
    onClick={() => onSort(column)}
  >
    <div className="flex items-center">
      {label}
      {sortColumn === column && (
        <ArrowUpDown className={cn("ml-2 h-4 w-4", sortDirection === 'desc' ? 'rotate-180' : '')} />
      )}
      {sortColumn !== column && <ArrowUpDown className="ml-2 h-4 w-4 text-gray-300" />}
    </div>
  </th>
);

export default ExtractedStringsTab;
