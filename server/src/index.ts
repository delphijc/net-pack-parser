import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import os from 'os';
import http from 'http';
import { apiRouter } from './routes';
import { sessionRouter } from './routes/sessions';
import { CleanupService } from './services/CleanupService';
import { WebSocketService } from './services/WebSocketService';
import { StorageService } from './services/StorageService';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize storage (creates captures directory)
StorageService.init();

// Start background services
CleanupService.start();

app.use('/api', apiRouter);
app.use('/api/sessions', sessionRouter);

// Health check and System Monitor
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        load: os.loadavg(),
        hostname: os.hostname()
    });
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const server = http.createServer(app);
WebSocketService.init(server);

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`WebSocket server available at ws://localhost:${port}`);
});

