import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';

export const sessionRouter = Router();

sessionRouter.get('/', SessionController.listSessions);
