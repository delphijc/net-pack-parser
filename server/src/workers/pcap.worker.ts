import { parentPort, workerData } from 'worker_threads';
import { parsePcapFile } from '../services/pcapService';
import { elasticService } from '../services/elasticService';
import { yaraService } from '../services/yaraService';

(async () => {
  try {
    const { filePath, sessionId } = workerData;

    console.log(`[Worker] Started for session ${sessionId}`);
    console.log(`[Worker] Elastic URL: ${process.env.ELASTICSEARCH_URL}`);
    console.log(`[Worker] File Path: ${filePath}`);

    // Initialize services in this thread
    await elasticService.connect();
    await yaraService.initialize();

    await parsePcapFile(filePath, sessionId, (count) => {
      parentPort?.postMessage({
        type: 'progress',
        sessionId,
        count,
      });
    });

    parentPort?.postMessage({
      type: 'complete',
      sessionId,
    });
  } catch (error) {
    console.error('Worker error:', error);
    parentPort?.postMessage({
      type: 'error',
      error,
    });
  }
})();
