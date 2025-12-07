import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import os from 'os';
import { apiRouter } from './routes';
import { sessionRouter } from './routes/sessions';
import { CleanupService } from './services/CleanupService';
import { WebSocketService } from './services/WebSocketService';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
