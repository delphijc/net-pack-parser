import { useEffect, useState } from 'react';
import { Activity, Server, Clock, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ServerStats {
  status: 'ok' | 'error' | 'offline';
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  load: number[];
  hostname: string;
}

export const ServerMonitor = () => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:3000/health');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data);
        setError(false);
      } catch (err) {
        setError(true);
        setStats(null);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  };

  return (
    <Card
      className={cn(
        'border-l-4',
        error ? 'border-l-destructive' : 'border-l-emerald-500',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Server Health</CardTitle>
        <Server
          className={cn(
            'h-4 w-4',
            error ? 'text-destructive' : 'text-emerald-500',
          )}
        />
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm font-medium text-destructive">Offline</div>
        ) : !stats ? (
          <div className="text-sm text-muted-foreground">Connecting...</div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="mr-1 h-3 w-3" />
              <span className={cn('font-bold text-foreground', 'mr-2')}>
                {stats.status.toUpperCase()}
              </span>
            </div>
            <div
              className="flex items-center text-xs text-muted-foreground"
              title="Uptime"
            >
              <Clock className="mr-1 h-3 w-3" />
              {formatUptime(stats.uptime)}
            </div>
            <div
              className="flex items-center text-xs text-muted-foreground"
              title="Memory (RSS)"
            >
              <Cpu className="mr-1 h-3 w-3" />
              {formatMemory(stats.memory.rss)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
