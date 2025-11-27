// src/test/setup.ts
import '@testing-library/jest-dom';

// Mock Web Worker to prevent "Worker is not defined" errors in tests
globalThis.Worker = class {
  constructor(stringUrl: string) {
    this.url = stringUrl;
    this.onmessage = () => { };
  }
  url: string;
  onmessage: (msg: any) => void;
  postMessage(msg: any) {
    // Simulate a message back from the worker
    // For stringExtractor, we might need to mock a more complex response.
    // For now, a simple passthrough or empty response is enough to prevent crashes.
    // If the test expects a result from the worker, this mock will need to be enhanced.
    this.onmessage({ data: msg });
  }
  terminate() { }
  addEventListener() { }
  removeEventListener() { }
  dispatchEvent(_event: Event): boolean {
    return true;
  }
} as any;
