// client/src/components/FilterBar.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export interface FilterBarProps {
  onFilterChange: (filter: string) => void;
  onClearFilter: () => void;
  errorMessage?: string;
  packetCount: number;
  totalPacketCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  onClearFilter,
  errorMessage,
  packetCount,
  totalPacketCount,
}) => {
  const [filterInput, setFilterInput] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filterInput);
  };

  const handleClear = () => {
    setFilterInput('');
    onClearFilter();
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter BPF filter (e.g., tcp port 80 or host 192.168.1.1)"
          value={filterInput}
          onChange={handleInputChange}
          className="flex-grow"
        />
        <Button type="submit">Apply Filter</Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Clear Filter
        </Button>
      </form>

      {errorMessage && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Invalid Filter</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-gray-500">
        {filterInput
          ? `Showing ${packetCount} of ${totalPacketCount} packets (filtered)`
          : `Showing all ${totalPacketCount} packets`}
      </div>
    </div>
  );
};
