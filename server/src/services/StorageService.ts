import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
    private static CAPTURE_DIR = path.join(process.cwd(), 'captures');

    static init() {
        if (!fs.existsSync(this.CAPTURE_DIR)) {
            fs.mkdirSync(this.CAPTURE_DIR, { recursive: true });
            console.log(`Created capture directory: ${this.CAPTURE_DIR}`);
        }
    }

    static generatePath(interfaceName: string): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `capture-${timestamp}-${interfaceName}-${uuidv4()}.pcap`;
        return path.join(this.CAPTURE_DIR, filename);
    }

    static listFiles(): string[] {
        if (!fs.existsSync(this.CAPTURE_DIR)) return [];
        return fs.readdirSync(this.CAPTURE_DIR).filter(f => f.endsWith('.pcap'));
    }

    static getCaptureDir(): string {
        return this.CAPTURE_DIR;
    }
}
