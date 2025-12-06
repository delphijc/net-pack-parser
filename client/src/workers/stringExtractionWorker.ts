// client/src/workers/stringExtractionWorker.ts

import { extractStringsFromBuffer } from '../utils/stringExtractorCore';

self.onmessage = (event: MessageEvent) => {
  const { requestId, payload, packetId, payloadOffset } = event.data;
  try {
    const extractedStrings = extractStringsFromBuffer(
      payload,
      packetId,
      payloadOffset,
    );
    self.postMessage({ requestId, status: 'success', extractedStrings });
  } catch (error: any) {
    self.postMessage({ requestId, status: 'error', message: error.message });
  }
};
