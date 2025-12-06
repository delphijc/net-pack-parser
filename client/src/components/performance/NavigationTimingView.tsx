import { useNavigationTiming } from '../../hooks/useNavigationTiming';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Server, Globe, Box, Database, Loader } from 'lucide-react';

export const NavigationTimingView = () => {
  const { metrics, isSupported } = useNavigationTiming();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Navigation Timing</CardTitle>
          <CardDescription>Not supported in this browser.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Navigation Timing</CardTitle>
          <CardDescription>Waiting for page load data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-full animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages for the stacked bar
  const total = metrics.loadTime || 1; // avoid division by zero

  const getPercent = (value: number) => Math.max(0.5, (value / total) * 100); // at least 0.5% to show something

  // Phases in order
  const phases = [
    {
      name: 'DNS',
      value: metrics.dns,
      color: 'bg-blue-500',
      icon: Cloud,
      label: 'DNS Lookup',
    },
    {
      name: 'TCP',
      value: metrics.tcp,
      color: 'bg-indigo-500',
      icon: Server,
      label: 'TCP Connection',
    },
    {
      name: 'Req',
      value: metrics.request,
      color: 'bg-purple-500',
      icon: Globe,
      label: 'Request',
    },
    {
      name: 'Res',
      value: metrics.response,
      color: 'bg-pink-500',
      icon: Database,
      label: 'Response',
    },
    {
      name: 'DOM',
      value: metrics.domProcessing,
      color: 'bg-teal-500',
      icon: Box,
      label: 'DOM Processing',
    },
    {
      name: 'Load',
      value: metrics.loadEvent,
      color: 'bg-green-500',
      icon: Loader,
      label: 'Load Event',
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Navigation Timing</span>
          <div className="flex gap-2">
            <Badge variant="outline">
              TTFB: {(metrics.ttfb ?? 0).toFixed(0)}ms
            </Badge>
            <Badge variant="secondary">Total Load: {total.toFixed(0)}ms</Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Breakdown of page load performance phases
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Timeline Visualization */}
        <div className="space-y-4">
          <div className="h-8 w-full flex rounded-md overflow-hidden bg-muted">
            {phases.map(
              (phase) =>
                phase.value > 0 && (
                  <div
                    key={phase.name}
                    className={`${phase.color} h-full transition-all duration-500 relative group`}
                    style={{ width: `${getPercent(phase.value)}%` }}
                  >
                    <span className="sr-only">{phase.label}</span>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <Badge className="whitespace-nowrap z-50">
                        {phase.name}: {phase.value.toFixed(0)}ms
                      </Badge>
                    </div>
                  </div>
                ),
            )}
          </div>

          {/* Legend / Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
            {phases.map((phase) => (
              <div
                key={phase.name}
                className="flex flex-col items-center p-2 rounded border bg-card/50"
              >
                <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                  <phase.icon className="h-3 w-3" />
                  <span className="text-xs">{phase.name}</span>
                </div>
                <div className="font-semibold">{phase.value.toFixed(0)}ms</div>
                <div
                  className={`h-1 w-full rounded-full mt-2 ${phase.color}`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
