import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export class MetaController {
    static getVersion(req: Request, res: Response): void {
        try {
            // Adjust path to point to package.json from dist or src logic
            // Assuming compiled code runs from dist/src/controllers, package.json is in root (../..)
            // Or if running via ts-node from src/controllers, it's also ../..
            // Let's try to resolve it relative to process.cwd() which is usually the server root
            const packagePath = path.join(process.cwd(), 'package.json');

            if (!fs.existsSync(packagePath)) {
                res.status(500).json({ error: 'Cannot find package.json' });
                return;
            }

            const packageContent = fs.readFileSync(packagePath, 'utf-8');
            const { version } = JSON.parse(packageContent);

            res.json({ version });
        } catch (error) {
            console.error('Failed to read version:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
