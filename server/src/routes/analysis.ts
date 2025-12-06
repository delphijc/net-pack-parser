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

// Store active parsing sessions (in-memory for MVP)
// In production this would be Redis/Database
export const activeSessions: Record<string, any> = {};

analysisRouter.post('/upload', upload.single('pcap'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const sessionId = req.file.filename; // Use filename as simple session ID

    console.log(`File uploaded: ${filePath}, Session: ${sessionId}`);

    // Initialize session state
    activeSessions[sessionId] = {
        status: 'processing',
        packets: [],
        progress: 0,
        error: null,
        summary: {
            packetCount: 0,
            totalBytes: 0,
        }
    };

    // Start parsing asynchronously
    parsePcapFile(filePath, sessionId)
        .then((packets) => {
            console.log(`Parsing complete for session ${sessionId}. Packets: ${packets.length}`);
            activeSessions[sessionId].status = 'complete';
            activeSessions[sessionId].packets = packets;
        })
        .catch((err) => {
            console.error(`Parsing error for session ${sessionId}:`, err);
            activeSessions[sessionId].status = 'error';
            activeSessions[sessionId].error = err.message;
        });

    // Return session ID immediately
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

analysisRouter.get('/analysis/:sessionId/results', (req, res) => {
    const { sessionId } = req.params;
    const session = activeSessions[sessionId];

    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'complete') {
        return res.json({
            status: session.status,
            packets: []
        });
    }

    // Allow pagination in future, sending all for now or first chunk
    // For large files, sending ALL JSON might still crash browser or be slow
    // Ideally we stream or paginate.
    // MVP: Send all, client handles it (still better than Client parsing everything)

    res.json({
        sessionId,
        status: session.status,
        summary: session.summary,
        packets: session.packets
    });
});
