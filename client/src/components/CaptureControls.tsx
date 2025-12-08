import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { AgentClient } from '@/services/AgentClient';
import { Play, Square, RefreshCw, Loader2 } from 'lucide-react';

interface NetworkInterface {
    name: string;
    addresses: { addr: string; netmask?: string }[];
    description: string;
}

interface CaptureControlsProps {
    onCaptureStarted?: (sessionId: string) => void;
    onCaptureStopped?: () => void;
}

export const CaptureControls: React.FC<CaptureControlsProps> = ({
    onCaptureStarted,
    onCaptureStopped
}) => {
    const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
    const [selectedInterface, setSelectedInterface] = useState<string>('');
    const [bpfFilter, setBpfFilter] = useState<string>('');
    const [isCapturing, setIsCapturing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [captureInfo, setCaptureInfo] = useState<{ id: string; output: string } | null>(null);

    const isConnected = AgentClient.isConnected();

    // Fetch interfaces on mount
    useEffect(() => {
        if (isConnected) {
            fetchInterfaces();
        }
    }, [isConnected]);

    const fetchInterfaces = async () => {
        try {
            setIsLoading(true);
            const ifaces = await AgentClient.getInterfaces();
            setInterfaces(ifaces);
            // Auto-select first interface with IPv4
            const defaultIface = ifaces.find((i: NetworkInterface) =>
                i.addresses.some(a => a.addr && !a.addr.includes(':'))
            );
            if (defaultIface) {
                setSelectedInterface(defaultIface.name);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartCapture = async () => {
        if (!selectedInterface) {
            setError('Please select an interface');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const result = await AgentClient.startCapture(selectedInterface, bpfFilter || undefined);
            setIsCapturing(true);
            setCaptureInfo(result.data);
            onCaptureStarted?.(result.data.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopCapture = async () => {
        if (!selectedInterface) return;

        try {
            setIsLoading(true);
            setError('');
            await AgentClient.stopCapture(selectedInterface);
            setIsCapturing(false);
            setCaptureInfo(null);
            onCaptureStopped?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                <p className="text-sm">Connect to a remote agent on the "Remote Capture" tab to enable live capture.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-card border border-white/10 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Capture Controls</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchInterfaces}
                    disabled={isLoading}
                    title="Refresh interfaces"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </Button>
            </div>

            <div className="flex flex-wrap gap-3 items-end">
                {/* Interface Selector */}
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Network Interface</label>
                    <Select
                        value={selectedInterface}
                        onValueChange={setSelectedInterface}
                        disabled={isCapturing || isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select interface..." />
                        </SelectTrigger>
                        <SelectContent>
                            {interfaces.map((iface) => (
                                <SelectItem key={iface.name} value={iface.name}>
                                    {iface.name} {iface.addresses[0]?.addr ? `(${iface.addresses[0].addr})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* BPF Filter */}
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-muted-foreground mb-1 block">BPF Filter (optional)</label>
                    <Input
                        placeholder="e.g., tcp port 80"
                        value={bpfFilter}
                        onChange={(e) => setBpfFilter(e.target.value)}
                        disabled={isCapturing || isLoading}
                        className="h-9"
                    />
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2">
                    {!isCapturing ? (
                        <Button
                            onClick={handleStartCapture}
                            disabled={isLoading || !selectedInterface}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Play size={16} className="mr-2" />
                            )}
                            Start Capture
                        </Button>
                    ) : (
                        <Button
                            onClick={handleStopCapture}
                            disabled={isLoading}
                            variant="destructive"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Square size={16} className="mr-2" />
                            )}
                            Stop Capture
                        </Button>
                    )}
                </div>
            </div>

            {/* Status / Error Messages */}
            {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}

            {isCapturing && captureInfo && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 p-2 rounded flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Capturing on {selectedInterface}... (Session: {captureInfo.id.slice(0, 20)}...)
                </div>
            )}
        </div>
    );
};
