import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, Globe } from 'lucide-react';
import type { ResourceType, DomainType } from '../../hooks/usePerformanceFilter';

interface PerformanceFiltersProps {
  resourceType: ResourceType;
  onResourceTypeChange: (type: ResourceType) => void;
  domain: DomainType;
  onDomainChange: (domain: DomainType) => void;
  minDuration: number;
  onMinDurationChange: (duration: number) => void;
}

export const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  resourceType,
  onResourceTypeChange,
  domain,
  onDomainChange,
  minDuration,
  onMinDurationChange,
}) => {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Type: {resourceType.toUpperCase()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={resourceType}
            onValueChange={(v) => onResourceTypeChange(v as ResourceType)}
          >
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="script">
              Scripts
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="fetch">
              Fetch/XHR
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="css">CSS</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="img">Images</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="other">Other</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Globe className="h-4 w-4" />
            Domain: {domain.toUpperCase()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={domain}
            onValueChange={(v) => onDomainChange(v as DomainType)}
          >
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="internal">
              Internal
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="external">
              External
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Min Duration (ms):</span>
        <Input
          type="number"
          value={minDuration}
          onChange={(e) => onMinDurationChange(Number(e.target.value))}
          className="w-24"
          min={0}
        />
      </div>
    </div>
  );
};
