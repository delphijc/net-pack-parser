// src/test/setup.ts
import '@testing-library/jest-dom';
import { extractStringsFromBuffer } from '../utils/stringExtractorCore';

// Mock IndexedDB
const indexedDBMock = {
  open: () => ({
    result: {},
    onerror: null,
    onsuccess: null,
  }),
};
globalThis.indexedDB = indexedDBMock as any;

// Mock Web Worker to properly simulate string extraction
globalThis.Worker = class {
  constructor(stringUrl: string) {
    this.url = stringUrl;
    this.onmessage = () => { };
  }
  url: string;
  onmessage: (msg: any) => void;
  postMessage(msg: any) {
    // Simulate the string extraction worker behavior
    const { payload, packetId, payloadOffset } = msg;

    // If this is a string extraction request, process it
    if (payload instanceof ArrayBuffer && packetId && payloadOffset !== undefined) {
      try {
        const extractedStrings = extractStringsFromBuffer(payload, packetId, payloadOffset);
        // Simulate async worker response
        setTimeout(() => {
          this.onmessage({ data: { status: 'success', extractedStrings } });
        }, 0);
      } catch (error: any) {
        setTimeout(() => {
          this.onmessage({ data: { status: 'error', message: error.message } });
        }, 0);
      }
    } else {
      // Default passthrough for other worker types
      this.onmessage({ data: msg });
    }
  }
  terminate() { }
  addEventListener() { }
  removeEventListener() { }
  dispatchEvent(_event: Event): boolean {
    return true;
  }
} as any;
