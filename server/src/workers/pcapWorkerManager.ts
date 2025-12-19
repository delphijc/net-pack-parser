import { kafkaService } from '../services/kafkaService';
import { Worker } from 'worker_threads';
import path from 'path';
import { activeSessions } from '../routes/analysis';

export const startPcapWorker = async () => {
  console.log('Starting PCAP Worker...');

  // Subscribe to PCAP upload topic
  await kafkaService.subscribe('pcap-upload', async (payload) => {
    if (!payload.message.value) return;

    const event = JSON.parse(payload.message.value.toString());
    const { filePath, sessionId } = event;

    console.log(`Worker received task: Parse ${sessionId}`);

    // Use Worker Thread to prevent event loop blocking
    const workerPath = path.join(__dirname, './workers/pcap.worker.js');

    // Note: In dev TS environment, we might need to point to the .ts file via ts-node or similar if not built.
    // But Docker runs 'npm run build' so it runs JS.
    // However, path.join(__dirname, './workers/pcap.worker.js') would be:
    // dist/workers/workers/pcap.worker.js? No.
    // __dirname in dist/workers/pcapWorker.js is .../dist/workers.
    // So ./pcap.worker.js is correct if both are in same folder.
    // checking where pcap.worker.ts will be output: dist/workers/pcap.worker.js.
    // So path.join(__dirname, 'pcap.worker.js') is correct.

    const worker = new Worker(path.join(__dirname, 'pcap.worker.js'), {
      workerData: { filePath, sessionId },
    });

    worker.on('message', (msg) => {
      if (msg.type === 'progress') {
        if (activeSessions[msg.sessionId]) {
          activeSessions[msg.sessionId].progress = msg.count;
          activeSessions[msg.sessionId].summary.packetCount = msg.count;
        }
      } else if (msg.type === 'complete') {
        console.log(`Worker finished task: Parse ${msg.sessionId}`);
        if (activeSessions[msg.sessionId]) {
          activeSessions[msg.sessionId].status = 'complete';
          if (typeof msg.count === 'number') {
            activeSessions[msg.sessionId].summary.packetCount = msg.count;
          }
        }
      } else if (msg.type === 'error') {
        console.error(
          `Worker failed task ${msg.sessionId || 'unknown'}:`,
          msg.error,
        );
        if (msg.sessionId && activeSessions[msg.sessionId]) {
          activeSessions[msg.sessionId].error = msg.error;
          activeSessions[msg.sessionId].status = 'error';
        }
      }
    });

    worker.on('error', (err) => {
      console.error('Worker thread error:', err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
    });
  });
};
