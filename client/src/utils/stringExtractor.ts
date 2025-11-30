// client/src/utils/stringExtractor.ts

// client/src/utils/stringExtractor.ts

import type { ExtractedString } from '../types/extractedStrings';

// Create a new Web Worker instance
const stringExtractionWorker = new Worker(
  new URL('../workers/stringExtractionWorker.ts', import.meta.url),
  { type: 'module' },
);

/**
 * Initiates string extraction from a payload using a Web Worker.
 *
 * @param payload The ArrayBuffer containing the packet payload.
 * @param packetId The ID of the packet this payload belongs to.
 * @param payloadOffset The starting offset of the payload within the original packet data.
 * @returns A Promise that resolves with an array of ExtractedString objects.
 */
export function extractStrings(
  payload: ArrayBuffer,
  packetId: string,
  payloadOffset: number,
): Promise<ExtractedString[]> {
  return new Promise((resolve, reject) => {
    stringExtractionWorker.onmessage = (event: MessageEvent) => {
      const { status, extractedStrings, message } = event.data;
      if (status === 'success') {
        resolve(extractedStrings);
      } else {
        reject(new Error(message || 'Unknown error during string extraction'));
      }
    };

    stringExtractionWorker.onerror = (error: ErrorEvent) => {
      reject(new Error(error.message || 'Error in string extraction worker'));
    };

    // Post the payload data to the worker for processing
    stringExtractionWorker.postMessage({ payload, packetId, payloadOffset }, [
      payload,
    ]);
  });
}
