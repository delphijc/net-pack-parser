import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { analysisRouter } from './routes/analysis';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
app.use('/api', analysisRouter);

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
