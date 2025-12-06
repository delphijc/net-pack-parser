// client/src/workers/stringExtractionWorker.ts

import { extractStringsFromBuffer } from '../utils/stringExtractorCore';

// Explicitly type `self` as DedicatedWorkerGlobalScope to ensure correct type inference
// and avoid potential 'any' issues, especially for `onmessage` and `postMessage`.
const ctx: Worker = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent) => {
  const { requestId, payload, packetId, payloadOffset } = event.data;
  try {
    const extractedStrings = extractStringsFromBuffer(
      payload,
      packetId,
      payloadOffset,
    );
    self.postMessage({ requestId, status: 'success', extractedStrings });
  } catch (error: unknown) {
    self.postMessage({
      requestId,
      status: 'error',
      message: (error as Error).message,
    });
  }
};
