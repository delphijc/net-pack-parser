import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to stub the global Worker before importing the module under test
// because the module instantiates the worker at the top level.

// Store the last created worker instance to interact with it in tests
let lastCreatedWorker: MockWorker | null = null;

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_scriptURL: string | URL, _options?: WorkerOptions) {
    this.postMessage = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastCreatedWorker = this;
  }

  // Helper to simulate receiving a message from the worker (worker -> main)
  emitMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  // Helper to simulate an error from the worker
  emitError(error: unknown) {
    if (this.onerror) {
      this.onerror(error as ErrorEvent);
    }
  }
}

vi.stubGlobal('Worker', MockWorker);

// Remove static import to prevent hoisting execution before mock
// import { extractStrings } from './stringExtractor';
import type { ExtractedString } from '../types/extractedStrings';

describe('stringExtractor', () => {
  let extractStrings: (
    payload: ArrayBuffer,
    packetId: string,
    payloadOffset: number,
  ) => Promise<ExtractedString[]>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // Ensure we get a fresh module instance (and pendingRequests map)

    // We need to re-import or ensure the module uses the mocked Worker.
    // Since we reset modules, this import triggers new Worker creation and new pendingRequests map.
    const mod = await import('./stringExtractor');
    extractStrings = mod.extractStrings;
  });

  it('should instantiate the worker', () => {
    expect(lastCreatedWorker).not.toBeNull();
  });

  it('should post a message to the worker with the correct payload', () => {
    const mockPayload = new ArrayBuffer(8);
    const mockPacketId = 'packet-1';
    const mockOffset = 0;

    extractStrings(mockPayload, mockPacketId, mockOffset);

    expect(lastCreatedWorker?.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: mockPayload,
        packetId: mockPacketId,
        payloadOffset: mockOffset,
        requestId: expect.any(String),
      }),
      [mockPayload],
    );
  });

  it('should resolve with extracted strings on success', async () => {
    const mockPayload = new ArrayBuffer(8);
    const mockPacketId = 'packet-1';
    const mockOffset = 0;
    const mockExtractedStrings: ExtractedString[] = [
      {
        id: '1',
        type: 'IP',
        value: '1.2.3.4',
        packetId: 'packet-1',
        payloadOffset: 0,
        length: 7,
      },
    ];

    const promise = extractStrings(mockPayload, mockPacketId, mockOffset);

    // Simulate worker success response
    const lastCall = (
      lastCreatedWorker?.postMessage as unknown as {
        mock: { lastCall: unknown[] };
      }
    ).mock.lastCall[0] as { requestId: string };
    const requestId = lastCall.requestId;

    lastCreatedWorker?.emitMessage({
      requestId,
      status: 'success',
      extractedStrings: mockExtractedStrings,
    });

    const result = await promise;
    expect(result).toEqual(mockExtractedStrings);
  });

  it('should reject with an error on failure', async () => {
    const mockPayload = new ArrayBuffer(8);
    const promise = extractStrings(mockPayload, 'packet-1', 0);

    // Simulate worker error response
    const lastCall = (
      lastCreatedWorker?.postMessage as unknown as {
        mock: { lastCall: unknown[] };
      }
    ).mock.lastCall[0] as { requestId: string };
    const requestId = lastCall.requestId;

    lastCreatedWorker?.emitMessage({
      requestId,
      status: 'error',
      message: 'Extraction failed',
    });

    await expect(promise).rejects.toThrow('Extraction failed');
  });

  it('should reject with a default error message if none provided on failure', async () => {
    const mockPayload = new ArrayBuffer(8);
    const promise = extractStrings(mockPayload, 'packet-1', 0);

    // Simulate worker error response without message
    const lastCall = (
      lastCreatedWorker?.postMessage as unknown as {
        mock: { lastCall: unknown[] };
      }
    ).mock.lastCall[0] as { requestId: string };
    const requestId = lastCall.requestId;

    lastCreatedWorker?.emitMessage({
      requestId,
      status: 'error',
    });

    await expect(promise).rejects.toThrow(
      'Unknown error during string extraction',
    );
  });

  it('should reject when worker throws an error event', async () => {
    const mockPayload = new ArrayBuffer(8);
    const promise = extractStrings(mockPayload, 'packet-1', 0);

    // Simulate worker error event
    lastCreatedWorker?.emitError({
      message: 'Worker crashed',
    });

    await expect(promise).rejects.toThrow('Worker crashed');
  });
});
