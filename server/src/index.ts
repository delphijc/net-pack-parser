import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import os from 'os';
import http from 'http';
import fs from 'fs';
import path from 'path';

import { kafkaService } from './services/kafkaService';
import { elasticService } from './services/elasticService';
import { apiRouter } from './routes';
import { CleanupService } from './services/CleanupService';
import { WebSocketService } from './services/WebSocketService';
import { StorageService } from './services/StorageService';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure database directory exists
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Initialize storage (creates captures directory)
StorageService.init();

// Start background services
CleanupService.start();
app.use('/api', apiRouter);

// Health check and System Monitor
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: process.memoryUsage(),
    load: os.loadavg(),
    hostname: os.hostname(),
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

import { startPcapWorker } from './workers/pcapWorkerManager';

import { yaraService } from './services/yaraService';

// Initialize Services
(async () => {
  try {
    await kafkaService.connect();
    await elasticService.connect();
    await yaraService.initialize();
    await startPcapWorker();
  } catch (e) {
    console.error('Failed to initialize infrastructure services', e);
  }
})();

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log(`WebSocket server available at ws://0.0.0.0:${port}`);
});
