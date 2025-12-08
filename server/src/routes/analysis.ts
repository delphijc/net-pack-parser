import express from 'express';
import multer from 'multer';
import path from 'path';
import { parsePcapFile } from '../services/pcapService';

export const analysisRouter = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save to server/uploads
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

import { kafkaService } from '../services/kafkaService';
import { elasticService } from '../services/elasticService';

// Store active parsing sessions (in-memory for MVP status tracking, full data in ES)
export const activeSessions: Record<string, any> = {};

analysisRouter.post('/upload', upload.single('pcap'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const sessionId = req.file.filename;

    console.log(`File uploaded: ${filePath}, Session: ${sessionId}`);

    // Initialize session state
    activeSessions[sessionId] = {
        status: 'processing',
        progress: 0,
        error: null,
        summary: {
            packetCount: 0,
            totalBytes: 0,
        }
    };

    // Offload to Kafka Worker
    try {
        await kafkaService.produce('pcap-upload', {
            filePath,
            sessionId
        });

        // Simulating the worker picking it up:
        // In a real microservice, a separate worker process would consume this.
        // For this MVP monolith, we'll start the processing logic "as if" triggered by Kafka if we wanted,
        // OR we can actually implement the Consumer in this same process to read it back.
        // Let's implement the Consumer listener in pcapService or index.ts to actually do the work.

    } catch (err: any) {
        console.error(`Failed to queue pcap for session ${sessionId}:`, err);
        return res.status(500).json({ error: 'Failed to queue file for processing' });
    }

    res.json({
        sessionId,
        status: 'processing',
        originalName: req.file.originalname,
        size: req.file.size
    });
});

analysisRouter.get('/analysis/:sessionId/status', (req, res) => {
    const { sessionId } = req.params;
    const session = activeSessions[sessionId];

    // If session is not in memory (restart?), check ES for ANY packet to see if it exists?
    // For MVP, keep using memory for status.

    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
        status: session.status,
        progress: session.progress,
        packetCount: session.summary.packetCount,
        error: session.error
    });
});

analysisRouter.get('/analysis/:sessionId/results', async (req, res) => {
    const { sessionId } = req.params;
    // Pagination params
    const from = parseInt(req.query.from as string) || 0;
    const size = parseInt(req.query.size as string) || 100;

    // Check if processing is done (optional, or just return what we have)
    // const session = activeSessions[sessionId];

    try {
        const hits = await elasticService.searchPackets(sessionId, size, from);

        // Map ES hits to clean Packet objects
        const packets = hits.hits.map((hit: any) => hit._source);

        res.json({
            sessionId,
            status: activeSessions[sessionId]?.status || 'unknown',
            summary: activeSessions[sessionId]?.summary || {},
            packets: packets,
            total: hits.total.value
        });
    } catch (e) {
        console.error('Failed to fetch results from ES', e);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

analysisRouter.get('/analysis/:sessionId/stats', async (req, res) => {
    const { sessionId } = req.params;

    try {
        const stats = await elasticService.getDashboardStats(sessionId);
        if (!stats) {
            return res.status(503).json({ error: 'Elasticsearch not connected' });
        }
        res.json(stats);
    } catch (e) {
        console.error('Failed to fetch stats from ES', e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
