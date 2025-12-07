// src/setupTests.ts

import '@testing-library/jest-dom/vitest';

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

import 'fake-indexeddb/auto';

class Worker {
  url: string;
  onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
  onerror: ((this: Worker, ev: ErrorEvent) => unknown) | null = null;
  constructor(stringUrl: string) {
    this.url = stringUrl;
  }
  postMessage() {
    // Default implementation does nothing
  }
  terminate() { }
  addEventListener() { }
  removeEventListener() { }
  dispatchEvent() {
    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.Worker = Worker as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = globalThis;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalAny.Worker = Worker as any;

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'mock-url';
}
