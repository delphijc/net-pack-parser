import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import url from 'url';
import { WSServerMessage, WSMessageType, PacketFilter, PacketData, PacketMessage } from '../types/WebSocketMessages';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

export class WebSocketService {
    private static wss: WebSocketServer;
    private static clientFilters: Map<WebSocket, PacketFilter> = new Map();

    public static init(server: Server): void {
        this.wss = new WebSocketServer({ noServer: true });

        server.on('upgrade', (request, socket, head) => {
            this.handleUpgrade(request, socket, head);
        });

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        console.log('WebSocket server initialized.');
    }

    private static handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): void {
        const { pathname, query } = url.parse(request.url || '', true);

        // Expect token in query string: ?token=...
        const token = query.token as string;

        if (!token) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            // If verification succeeds, we're good.

            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
            });
        } catch (err) {
            socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
            socket.destroy();
            return;
        }
    }

    private static handleConnection(ws: WebSocket, req: IncomingMessage): void {
        console.log('New WebSocket connection established.');

        ws.on('message', (message) => {
            try {
                const msg = JSON.parse(message.toString());
                if (msg.type === WSMessageType.UPDATE_FILTER) {
                    this.clientFilters.set(ws, msg.filters || {});
                    console.log('Filter updated for client:', msg.filters);
                }
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        });

        ws.on('close', () => {
            this.clientFilters.delete(ws);
            console.log('WebSocket connection closed.');
        });
    }

    private static matchesFilter(packet: PacketData, filter: PacketFilter): boolean {
        if (filter.protocol && packet.protocol.toLowerCase() !== filter.protocol.toLowerCase()) {
            return false;
        }
        if (filter.sourceIP && packet.sourceIP !== filter.sourceIP) {
            return false;
        }
        if (filter.destinationIP && packet.destinationIP !== filter.destinationIP) {
            return false;
        }
        if (filter.port && packet.sourcePort !== filter.port && packet.destinationPort !== filter.port) {
            return false;
        }
        return true;
    }

    public static broadcast(message: WSServerMessage): void {
        if (!this.wss) return;

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                // Apply per-client filter for PACKET messages
                if (message.type === WSMessageType.PACKET) {
                    const filter = this.clientFilters.get(client);
                    if (filter && Object.keys(filter).length > 0) {
                        if (!this.matchesFilter((message as PacketMessage).data, filter)) {
                            return; // Skip this client
                        }
                    }
                }
                client.send(JSON.stringify(message));
            }
        });
    }
}

