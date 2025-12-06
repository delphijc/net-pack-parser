
import { usePerformanceStore } from '../../store/performanceStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const LongTasksView = () => {
    const { longTasks } = usePerformanceStore();

    if (!longTasks || longTasks.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Long Tasks (Main Thread)
                    </CardTitle>
                    <CardDescription>Tasks blocking the main thread &gt; 50ms</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center justify-center p-8 border rounded-md border-dashed">
                        No long tasks detected.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Long Tasks
                    </div>
                    <Badge variant="outline">{longTasks.length} Detected</Badge>
                </CardTitle>
                <CardDescription>Recent main thread blocking tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-[300px] md:h-[400px]">
                    <div className="divide-y">
                        {longTasks.map((task) => (
                            <div key={task.id} className="p-4 flex items-start justify-between hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        <span className="text-muted-foreground">Source:</span>
                                        <span className="truncate max-w-[200px]" title={task.attribution}>
                                            {task.attribution}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Start: {task.startTime.toFixed(2)}ms
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={task.duration > 100 ? "destructive" : "default"}
                                        className={task.duration > 100 ? "" : "bg-yellow-500 hover:bg-yellow-600"}
                                    >
                                        {task.duration.toFixed(0)}ms
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
