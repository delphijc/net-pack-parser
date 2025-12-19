import { Request, Response } from 'express';
import { CaptureService } from '../services/CaptureService';

export class InterfaceController {
  public static listInterfaces(req: Request, res: Response): void {
    try {
      const interfaces = CaptureService.getInterfaces();
      res.json(interfaces);
    } catch (error) {
      console.error('InterfaceController error:', error);
      res
        .status(500)
        .json({ error: 'Internal Server Error fetching interfaces' });
    }
  }
}
