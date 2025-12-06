// client/src/utils/stringExtractor.ts

// client/src/utils/stringExtractor.ts

import type { ExtractedString } from '../types/extractedStrings';
import { v4 as uuidv4 } from 'uuid';

// Create a new Web Worker instance
const stringExtractionWorker = new Worker(
  new URL('../workers/stringExtractionWorker.ts', import.meta.url),
  { type: 'module' },
);

// Map to store pending requests
const pendingRequests = new Map<
  string,
  {
    resolve: (value: ExtractedString[]) => void;
    reject: (reason?: unknown) => void;
  }
>();

// Set up the message handler once
stringExtractionWorker.onmessage = (event: MessageEvent) => {
  const { requestId, status, extractedStrings, message } = event.data;
  console.log(
    `[StringExtractor] Received response for ${requestId}, status: ${status}`,
  );
  const pending = pendingRequests.get(requestId);

  if (pending) {
    if (status === 'success') {
      pending.resolve(extractedStrings);
    } else {
      pending.reject(
        new Error(message || 'Unknown error during string extraction'),
      );
    }
    pendingRequests.delete(requestId);
  }
};

stringExtractionWorker.onerror = (error: ErrorEvent) => {
  console.error('Worker error:', error);
  // Re-throw to global handler or specific pending requests if possible?
  // For now, just log. Ideally we should reject all pending?
  pendingRequests.forEach((pending) => {
    pending.reject(
      new Error(error.message || 'Error in string extraction worker'),
    );
  });
  pendingRequests.clear();
};

/**
 * Initiates string extraction from a payload using a Web Worker.
 * Uses a requestId to map responses back to the correct promise.
 */
export function extractStrings(
  payload: ArrayBuffer,
  packetId: string,
  payloadOffset: number,
): Promise<ExtractedString[]> {
  return new Promise((resolve, reject) => {
    const requestId = uuidv4();
    pendingRequests.set(requestId, { resolve, reject });

    // Post the payload data to the worker for processing
    // We send requestId so the worker can echo it back
    console.log(`[StringExtractor] Sending request ${requestId} to worker`);
    stringExtractionWorker.postMessage(
      { requestId, payload, packetId, payloadOffset },
      [payload],
    );
  });
}
