import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface WebSocketContextType {
    socket: WebSocket | null;
    readyState: number;
    isConnected: boolean;
    lastMessage: MessageEvent | null;
    sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
    isReconnecting: boolean;
    reconnectionFailed: boolean;
    retryCount: number;
    manualReconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [agentUrl, setAgentUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        const checkUrl = () => {
            const stored = localStorage.getItem('agent_connection');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.url && parsed.url !== agentUrl) {
                        setAgentUrl(parsed.url);
                    }
                } catch { }
            }
        };

        checkUrl();
        const interval = setInterval(checkUrl, 2000);
        return () => clearInterval(interval);
    }, [agentUrl]);

    const {
        socket,
        readyState,
        isConnected,
        lastMessage,
        sendMessage,
        isReconnecting,
        reconnectionFailed,
        retryCount,
        manualReconnect
    } = useWebSocket(agentUrl);

    return (
        <WebSocketContext.Provider value={{
            socket,
            readyState,
            isConnected,
            lastMessage,
            sendMessage,
            isReconnecting,
            reconnectionFailed,
            retryCount,
            manualReconnect
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
};

