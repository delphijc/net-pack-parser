import { kafkaService, KafkaService } from '../services/kafkaService';
import { parsePcapFile } from '../services/pcapService';

export const startPcapWorker = async () => {
    console.log('Starting PCAP Worker...');

    // Subscribe to PCAP upload topic
    await kafkaService.subscribe('pcap-upload', async (payload) => {
        if (!payload.message.value) return;

        const event = JSON.parse(payload.message.value.toString());
        const { filePath, sessionId } = event;

        console.log(`Worker received task: Parse ${sessionId}`);

        try {
            await parsePcapFile(filePath, sessionId);
            console.log(`Worker finished task: Parse ${sessionId}`);
        } catch (error) {
            console.error(`Worker failed task ${sessionId}:`, error);
        }
    });
};
