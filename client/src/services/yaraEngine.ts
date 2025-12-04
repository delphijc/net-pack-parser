// client/src/services/yaraEngine.ts

export interface YaraMatch {
    rule: string;
    meta: Record<string, string>;
    matches: { identifier: string; offset: number; length: number }[];
}

class YaraEngine {
    private worker: Worker | null = null;
    private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

    constructor() {
        if (typeof Worker !== 'undefined') {
            this.worker = new Worker(new URL('../workers/yaraWorker.ts', import.meta.url), {
                type: 'module',
            });

            this.worker.onmessage = (e) => {
                const { id, success, error, ...data } = e.data;
                const request = this.pendingRequests.get(id);
                if (request) {
                    if (success) {
                        request.resolve(data);
                    } else {
                        request.reject(new Error(error));
                    }
                    this.pendingRequests.delete(id);
                }
            };
        }
    }

    private sendRequest(type: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('YARA Worker not initialized'));
                return;
            }
            const id = Math.random().toString(36).substring(7);
            this.pendingRequests.set(id, { resolve, reject });
            this.worker.postMessage({ type, payload, id });
        });
    }

    async compileRules(rules: string[]): Promise<{ ruleCount: number }> {
        return this.sendRequest('compile', rules);
    }

    async scanPayload(payload: Uint8Array): Promise<{ matches: YaraMatch[] }> {
        return this.sendRequest('scan', payload);
    }
}

export const yaraEngine = new YaraEngine();
