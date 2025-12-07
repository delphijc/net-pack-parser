import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

export class AuthController {
    public static login(req: Request, res: Response): void {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            const token = jwt.sign(
                { username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
}
