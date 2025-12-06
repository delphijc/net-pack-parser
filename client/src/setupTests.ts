// src/setupTests.ts

import '@testing-library/jest-dom';

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
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  onerror: ((this: Worker, ev: ErrorEvent) => any) | null = null;
  constructor(stringUrl: string) {
    this.url = stringUrl;
  }
  postMessage(msg: any) {
    // Default implementation does nothing
  }
  terminate() { }
  addEventListener() { }
  removeEventListener() { }
  dispatchEvent() { return true; }
}

window.Worker = Worker as any;
const globalAny: any = globalThis;
globalAny.Worker = Worker as any;

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'mock-url';
}
