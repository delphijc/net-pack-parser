import express from 'express';
import { elasticService } from '../services/elasticService';
import { iocService } from '../services/iocService';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// POST /api/admin/clear-all
// Clears all analysis data: Elasticsearch indices, PCAP files, and IOC database
router.post('/clear-all', async (req, res) => {
    try {
        console.log('[Admin] Starting system cleanup...');

        // 1. Clear Elasticsearch indices
        await elasticService.clearAllIndices();
        console.log('[Admin] Elasticsearch indices cleared');

        // 2. Clear IOC database
        iocService.clearAll();
        console.log('[Admin] IOC database cleared');

        // 3. Clear uploaded PCAP files
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
            console.log(`[Admin] Deleted ${files.length} files from uploads directory`);
        }

        // 4. Clear captures directory (live capture PCAPs)
        const capturesDir = path.join(process.cwd(), 'captures');
        if (fs.existsSync(capturesDir)) {
            const files = fs.readdirSync(capturesDir);
            for (const file of files) {
                const filePath = path.join(capturesDir, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
            console.log(`[Admin] Deleted ${files.length} files from captures directory`);
        }

        console.log('[Admin] System cleanup completed');

        res.json({
            success: true,
            message: 'All analysis data cleared successfully',
            cleared: {
                elasticsearch: true,
                iocs: true,
                uploads: true,
                captures: true,
            },
        });
    } catch (error: any) {
        console.error('[Admin] Cleanup failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear analysis data',
            message: error.message,
        });
    }
});

export default router;
