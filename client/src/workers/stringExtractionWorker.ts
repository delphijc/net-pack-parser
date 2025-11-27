// client/src/workers/stringExtractionWorker.ts

import { extractStringsFromBuffer } from '../utils/stringExtractorCore';

self.onmessage = (event: MessageEvent) => {
  const { payload, packetId, payloadOffset } = event.data;
  try {
    const extractedStrings = extractStringsFromBuffer(payload, packetId, payloadOffset);
    self.postMessage({ status: 'success', extractedStrings });
  } catch (error: any) {
    self.postMessage({ status: 'error', message: error.message });
  }
};