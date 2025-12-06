import { Button } from '@/components/ui/button';

export type TimeRange = '5m' | '15m' | 'all';

interface TrendControlsProps {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export const TrendControls = ({ range, onRangeChange }: TrendControlsProps) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant={range === '5m' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onRangeChange('5m')}
      >
        Last 5m
      </Button>
      <Button
        variant={range === '15m' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onRangeChange('15m')}
      >
        Last 15m
      </Button>
      <Button
        variant={range === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onRangeChange('all')}
      >
        All Time
      </Button>
    </div>
  );
};
