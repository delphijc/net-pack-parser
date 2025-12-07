import React, { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { AgentClient } from '../services/AgentClient';

export const ConnectionStatus: React.FC = () => {
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [latency, setLatency] = useState<number | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const checkConnection = async () => {
        if (!AgentClient.isConnected()) {
            setStatus('disconnected');
            setLatency(null);
            return;
        }

        try {
            const ms = await AgentClient.ping();
            setStatus('connected');
            setLatency(ms);
            setRetryCount(0); // Reset retry count on success

            // Schedule next check in 5s
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(checkConnection, 5000);
        } catch (error) {
            setStatus('reconnecting');
            setLatency(null);

            // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
            const backoff = Math.min(1000 * Math.pow(2, retryCount), 30000);
            setRetryCount(prev => prev + 1);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(checkConnection, backoff);
        }
    };

    useEffect(() => {
        checkConnection();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (!AgentClient.isConnected()) {
        return null;
    }

    const getBadgeVariant = () => {
        switch (status) {
            case 'connected': return 'outline';
            case 'reconnecting': return 'secondary'; // Amber/Yellow-ish usually, secondary is gray in shadcn default, lets style manually if needed
            default: return 'destructive';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return 'text-emerald-500';
            case 'reconnecting': return 'text-amber-500';
            default: return 'text-destructive';
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'connected': return <Wifi size={14} className="text-emerald-500" />;
            case 'reconnecting': return <RefreshCw size={14} className="text-amber-500 animate-spin" />;
            default: return <WifiOff size={14} />;
        }
    };

    const getLabel = () => {
        switch (status) {
            case 'connected': return 'Connected';
            case 'reconnecting': return `Reconnecting (${retryCount})`;
            default: return 'Disconnected';
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant={getBadgeVariant()} className="flex items-center gap-1 cursor-help">
                        {getIcon()}
                        <span className={getStatusColor()}>
                            {getLabel()}
                        </span>
                        {status === 'connected' && latency !== null && (
                            <span className="text-xs text-muted-foreground ml-1">
                                {latency}ms
                            </span>
                        )}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {status === 'connected' ? `Agent Online (${latency}ms latency)` :
                            status === 'reconnecting' ? `Attempting to reconnect (Attempt ${retryCount})...` :
                                "Agent Unreachable"}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
