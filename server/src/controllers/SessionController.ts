import { Request, Response } from 'express';
import { sessionRepository } from '../repositories/SessionRepository';

export class SessionController {
    public static listSessions(req: Request, res: Response): void {
        try {
            const sessions = sessionRepository.getAll();
            // Sort by startTime (descending)
            sessions.sort((a, b) => b.startTime - a.startTime);
            res.json(sessions);
        } catch (error) {
            console.error('Error listing sessions:', error);
            res.status(500).json({ error: 'Failed to list sessions' });
        }
    }
}
