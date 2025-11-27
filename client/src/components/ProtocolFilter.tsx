// client/src/components/ProtocolFilter.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProtocolFilterProps {
  protocols: string[];
  selectedProtocol: string | undefined;
  onProtocolChange: (protocol: string | undefined) => void;
}

export const ProtocolFilter: React.FC<ProtocolFilterProps> = ({
  protocols,
  selectedProtocol,
  onProtocolChange,
}) => {
  return (
    <Select
      onValueChange={(value) => onProtocolChange(value === 'all' ? undefined : value)}
      value={selectedProtocol || 'all'}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by Protocol" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Protocols</SelectItem>
        {protocols.map((protocol) => (
          <SelectItem key={protocol} value={protocol}>
            {protocol}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
