import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentClient } from '../services/AgentClient';

export interface WebSocketState {
    socket: WebSocket | null;
    readyState: number;
    isConnected: boolean;
    lastMessage: MessageEvent | null;
    isReconnecting: boolean;
    reconnectionFailed: boolean;
    retryCount: number;
}

const MAX_RETRIES = 5;

export const useWebSocket = (url?: string) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
    const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectionFailed, setReconnectionFailed] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const isUnmountingRef = useRef(false);

    const INITIAL_RETRY_DELAY = 1000;
    const MAX_RETRY_DELAY = 30000;

    const connect = useCallback(() => {
        if (!url || isUnmountingRef.current) return;

        if (wsRef.current) {
            wsRef.current.close();
        }

        const token = AgentClient.getToken();
        if (!token) {
            console.warn('Cannot connect to WebSocket: No auth token available.');
            return;
        }

        let wsUrl = url.replace(/^http/, 'ws');
        if (wsUrl.startsWith('https')) {
            wsUrl = wsUrl.replace(/^https/, 'wss');
        }

        const fullUrl = `${wsUrl}?token=${token}`;

        console.log(`Connecting to WebSocket: ${wsUrl}`);

        try {
            const ws = new WebSocket(fullUrl);
            wsRef.current = ws;
            setReadyState(WebSocket.CONNECTING);

            ws.onopen = () => {
                if (isUnmountingRef.current) {
                    ws.close();
                    return;
                }
                console.log('WebSocket connected');
                setSocket(ws);
                setReadyState(WebSocket.OPEN);
                setIsReconnecting(false);
                setReconnectionFailed(false);
                retryCountRef.current = 0;
                setRetryCount(0);
            };

            ws.onmessage = (event) => {
                setLastMessage(event);
            };

            ws.onclose = (event) => {
                if (isUnmountingRef.current) return;

                setSocket(null);
                setReadyState(WebSocket.CLOSED);
                console.log('WebSocket disconnected', event.code, event.reason);

                if (event.code !== 1000) {
                    scheduleReconnect();
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            scheduleReconnect();
        }
    }, [url]);

    const scheduleReconnect = useCallback(() => {
        if (isUnmountingRef.current || reconnectTimeoutRef.current) return;

        if (retryCountRef.current >= MAX_RETRIES) {
            console.error(`Max reconnection attempts (${MAX_RETRIES}) reached.`);
            setIsReconnecting(false);
            setReconnectionFailed(true);
            return;
        }

        setIsReconnecting(true);
        setReconnectionFailed(false);

        const delay = Math.min(
            INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
            MAX_RETRY_DELAY
        );

        console.log(`Reconnecting WebSocket in ${delay}ms... (Attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);

        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            retryCountRef.current++;
            setRetryCount(retryCountRef.current);
            connect();
        }, delay);
    }, [connect]);

    const manualReconnect = useCallback(() => {
        retryCountRef.current = 0;
        setRetryCount(0);
        setReconnectionFailed(false);
        connect();
    }, [connect]);

    useEffect(() => {
        isUnmountingRef.current = false;
        connect();

        return () => {
            isUnmountingRef.current = true;
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
        } else {
            console.warn('Cannot send message: WebSocket is not open.');
        }
    }, []);

    return {
        socket,
        readyState,
        lastMessage,
        sendMessage,
        isConnected: readyState === WebSocket.OPEN,
        isReconnecting,
        reconnectionFailed,
        retryCount,
        manualReconnect
    };
};

