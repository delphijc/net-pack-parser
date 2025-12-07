import { Router } from 'express';
import { captureRouter } from './capture';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';
import { InterfaceController } from '../controllers/InterfaceController';

export const apiRouter = Router();

import { MetaController } from '../controllers/MetaController';

// Public routes
apiRouter.get('/version', MetaController.getVersion);
apiRouter.post('/auth/login', AuthController.login);

// Protected routes
apiRouter.use('/capture', authMiddleware, captureRouter);

// Alias strict interface listing
const interfaceRouter = Router();
interfaceRouter.get('/', InterfaceController.listInterfaces);
apiRouter.use('/interfaces', authMiddleware, interfaceRouter);
