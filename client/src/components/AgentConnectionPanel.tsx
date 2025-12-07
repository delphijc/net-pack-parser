import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgentClient } from '../services/AgentClient';

export const AgentConnectionPanel: React.FC = () => {
    const [url, setUrl] = useState('http://localhost:3000');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Check initial state
        const config = AgentClient.loadConfig();
        if (config) {
            setIsConnected(true);
            setUrl(config.url);
            setStatusMessage(`Connected to ${config.url}`);
        }
    }, []);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setStatusMessage('Connecting...');

        try {
            await AgentClient.login(url, username, password);
            setIsConnected(true);
            setStatusMessage(`Connected to ${url}`);
            setPassword(''); // Clear password from memory
        } catch (err: any) {
            setIsConnected(false);
            setError(err.message);
            setStatusMessage('');
        }
    };

    const handleDisconnect = () => {
        AgentClient.clearConfig();
        setIsConnected(false);
        setStatusMessage('');
        setError('');
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Remote Agent Connection</CardTitle>
            </CardHeader>
            <CardContent>
                {isConnected ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                            {statusMessage}
                        </div>
                        <Button variant="destructive" onClick={handleDisconnect} className="w-full">
                            Disconnect
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleConnect} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">Agent URL</Label>
                            <Input
                                id="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://localhost:3000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 font-medium">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full">Connect</Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
};
