import React from 'react';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

export const ConnectionBanner: React.FC = () => {
    const { isReconnecting, reconnectionFailed, retryCount, manualReconnect } = useWebSocketContext();

    if (!isReconnecting && !reconnectionFailed) {
        return null;
    }

    if (reconnectionFailed) {
        return (
            <div className="bg-destructive text-destructive-foreground p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <WifiOff className="h-5 w-5" />
                    <span className="font-medium">Connection Lost</span>
                    <span className="text-sm opacity-80">Unable to connect after 5 attempts.</span>
                </div>
                <Button size="sm" variant="secondary" onClick={manualReconnect} className="gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-yellow-500 text-yellow-950 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Reconnecting...</span>
            <span className="text-sm opacity-80">Attempt {retryCount + 1} of 5</span>
        </div>
    );
};
