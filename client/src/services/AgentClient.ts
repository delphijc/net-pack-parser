
export interface ConnectionConfig {
    url: string;
    token: string;
}

export class AgentClient {
    private static STORAGE_KEY = 'agent_connection';
    private static config: ConnectionConfig | null = null;

    static loadConfig(): ConnectionConfig | null {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.config = JSON.parse(stored);
                return this.config;
            } catch (e) {
                console.error('Failed to parse stored agent config', e);
            }
        }
        return null;
    }

    static saveConfig(url: string, token: string) {
        this.config = { url, token };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    }

    static clearConfig() {
        this.config = null;
        localStorage.removeItem(this.STORAGE_KEY);
    }

    static getConfig(): ConnectionConfig | null {
        if (!this.config) {
            this.loadConfig();
        }
        return this.config;
    }

    static getToken(): string | undefined {
        return this.getConfig()?.token;
    }

    // Simplified semver check
    static async checkVersion(baseUrl: string): Promise<void> {
        try {
            const response = await fetch(`${baseUrl}/api/version`);
            if (!response.ok) return; // If 404, assume old version? Or strictly fail? Let's assume OK for MVP if missing but good to fail if strict.

            const { version: serverVersion } = await response.json();
            const clientVersion = '1.0.0'; // Hardcoded for now as importing package.json in client builds is tricky without config

            const [sMajor, sMinor] = serverVersion.split('.').map(Number);
            const [cMajor, cMinor] = clientVersion.split('.').map(Number);

            if (sMajor !== cMajor) {
                throw new Error(`Incompatible server version: ${serverVersion}. Client expects ${clientVersion} (Major version mismatch).`);
            }

            if (sMinor !== cMinor) {
                console.warn(`Version mismatch: Server ${serverVersion}, Client ${clientVersion}. Some features may not work.`);
            }

        } catch (e: any) {
            // Rethrow explicit version errors, ignore fetch errors (network handled elsewhere or lenient)
            if (e.message.includes('Incompatible')) throw e;
            console.warn('Failed to check version compatibility', e);
        }
    }

    static async login(url: string, username: string, password: string): Promise<string> {
        // Ensure standard URL format (remove trailing slash)
        const baseUrl = url.replace(/\/$/, '');

        // Check version first
        await this.checkVersion(baseUrl);

        const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        this.saveConfig(baseUrl, data.token);
        return data.token;
    }

    static async get(path: string): Promise<any> {
        const config = this.getConfig();
        if (!config) throw new Error('Not connected');

        const response = await fetch(`${config.url}${path}`, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            }
        });

        if (response.status === 401) {
            this.clearConfig(); // Auto logout on 401
            throw new Error('Unauthorized - Session expired');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `Request failed: ${response.statusText}`);
        }

        return response.json();
    }

    static isConnected(): boolean {
        return !!this.getConfig();
    }

    static async ping(): Promise<number> {
        const config = this.getConfig();
        if (!config) throw new Error('Not connected');

        const start = performance.now();
        const response = await fetch(`${config.url}/health`);
        const end = performance.now();

        if (!response.ok) {
            throw new Error('Health check failed');
        }

        return Math.round(end - start);
    }

    // Capture control methods
    static async getInterfaces(): Promise<any[]> {
        return this.get('/api/capture/interfaces');
    }

    static async startCapture(interfaceName: string, filter?: string): Promise<any> {
        const config = this.getConfig();
        if (!config) throw new Error('Not connected');

        const response = await fetch(`${config.url}/api/capture/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.token}`
            },
            body: JSON.stringify({ interface: interfaceName, filter })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `Failed to start capture`);
        }

        return response.json();
    }

    static async stopCapture(interfaceName: string): Promise<any> {
        const config = this.getConfig();
        if (!config) throw new Error('Not connected');

        const response = await fetch(`${config.url}/api/capture/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.token}`
            },
            body: JSON.stringify({ interface: interfaceName })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `Failed to stop capture`);
        }

        return response.json();
    }

    static async getCaptureStats(interfaceName: string): Promise<any> {
        return this.get(`/api/capture/stats?interface=${encodeURIComponent(interfaceName)}`);
    }
}

