import { JsonDatabase } from '../db/Database';

export interface SessionRecord {
    id: string;
    interfaceName: string;
    startTime: number;
    endTime: number | null;
    status: 'running' | 'paused' | 'finished' | 'stopped';
    packetCount: number;
    sizeBytes: number;
    outputFilePath: string;
}

interface DBData {
    sessions: SessionRecord[];
}

export class SessionRepository {
    private db: JsonDatabase<DBData>;

    constructor() {
        this.db = new JsonDatabase<DBData>('db.json');
        // Initialize if empty
        const data = this.db.read();
        if (!data || !data.sessions) {
            this.db.write({ sessions: [] });
        }
    }

    getAll(): SessionRecord[] {
        return this.db.read().sessions;
    }

    getById(id: string): SessionRecord | undefined {
        return this.db.read().sessions.find(s => s.id === id);
    }

    create(session: SessionRecord): void {
        const data = this.db.read();
        data.sessions.push(session);
        this.db.write(data);
    }

    update(id: string, updates: Partial<SessionRecord>): void {
        const data = this.db.read();
        const index = data.sessions.findIndex(s => s.id === id);
        if (index !== -1) {
            data.sessions[index] = { ...data.sessions[index], ...updates };
            this.db.write(data);
        }
    }

    delete(id: string): void {
        const data = this.db.read();
        const initialLength = data.sessions.length;
        data.sessions = data.sessions.filter(s => s.id !== id);
        if (data.sessions.length !== initialLength) {
            this.db.write(data);
        }
    }
}

export const sessionRepository = new SessionRepository();
