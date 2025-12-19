import { Router } from 'express';
import { captureRouter } from './capture';
import { analysisRouter } from './analysis';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';
import { InterfaceController } from '../controllers/InterfaceController';

export const apiRouter = Router();

import { MetaController } from '../controllers/MetaController';
import yaraRouter from './yara';
import { sessionRouter } from './sessions';
import iocRouter from './iocs';

// Public routes
apiRouter.get('/version', MetaController.getVersion);
apiRouter.post('/auth/login', AuthController.login);

// Analysis routes (includes /upload - public for file upload)
apiRouter.use('/yara', yaraRouter);
apiRouter.use('/sessions', sessionRouter);
apiRouter.use('/iocs', iocRouter);
apiRouter.use('/', analysisRouter);

// Protected routes
apiRouter.use('/capture', authMiddleware, captureRouter);

// Alias strict interface listing
const interfaceRouter = Router();
interfaceRouter.get('/', InterfaceController.listInterfaces);
apiRouter.use('/interfaces', authMiddleware, interfaceRouter);
