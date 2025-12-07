import { Router } from 'express';
import { InterfaceController } from '../controllers/InterfaceController';
import { CaptureController } from '../controllers/CaptureController';

export const captureRouter = Router();

captureRouter.get('/interfaces', InterfaceController.listInterfaces);
captureRouter.post('/start', CaptureController.startCapture);
captureRouter.post('/stop', CaptureController.stopCapture);
captureRouter.post('/pause', CaptureController.pauseCapture);
captureRouter.post('/resume', CaptureController.resumeCapture);
captureRouter.get('/sessions', CaptureController.listSessions);
captureRouter.get('/stats', CaptureController.getStats);
captureRouter.get('/download/:id', CaptureController.downloadCapture);
