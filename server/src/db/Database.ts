import fs from 'fs';
import path from 'path';

export class JsonDatabase<T> {
    private filePath: string;
    private data: T | null = null;

    constructor(filename: string) {
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.filePath = path.join(dataDir, filename);
    }

    private load(): void {
        if (fs.existsSync(this.filePath)) {
            try {
                const content = fs.readFileSync(this.filePath, 'utf-8');
                this.data = JSON.parse(content);
            } catch (error) {
                console.error(`Failed to load database from ${this.filePath}`, error);
                this.data = null;
            }
        } else {
            this.data = null;
        }
    }

    private save(): void {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error(`Failed to save database to ${this.filePath}`, error);
        }
    }

    public read(): T {
        if (this.data === null) {
            this.load();
        }
        return this.data as T;
    }

    public write(data: T): void {
        this.data = data;
        this.save();
    }
}
