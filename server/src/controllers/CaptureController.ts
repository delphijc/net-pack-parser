import { Request, Response } from 'express';
import { CaptureService } from '../services/CaptureService';
import { StorageService } from '../services/StorageService';

export class CaptureController {
  public static async startCapture(req: Request, res: Response): Promise<void> {
    const {
      interface: interfaceName,
      promiscuous,
      filter,
      sizeLimit,
    } = req.body;

    if (!interfaceName) {
      res.status(400).json({ error: 'Interface name is required' });
      return;
    }

    try {
      const session = await CaptureService.startCapture(
        interfaceName,
        filter,
        sizeLimit ? Number(sizeLimit) : 0,
      );
      res.status(201).json({
        message: 'Capture started',
        data: {
          id: session.id,
          output: session.outputFilePath,
        },
      });
    } catch (error: any) {
      console.error('Start capture error details:', error);
      if (error.message.includes('already running')) {
        res.status(409).json({ error: error.message });
      } else if (
        error.message.toLowerCase().includes('syntax') ||
        error.message.toLowerCase().includes('expression')
      ) {
        res.status(400).json({ error: `Invalid BPF filter: ${error.message}` });
      } else {
        res.status(500).json({ error: 'Failed to start capture' });
      }
    }
  }

  public static stopCapture(req: Request, res: Response): void {
    const { interface: interfaceName } = req.body;

    if (!interfaceName) {
      res.status(400).json({ error: 'Interface name is required' });
      return;
    }

    try {
      const info = CaptureService.stopCapture(interfaceName);
      res.status(200).json({
        message: 'Capture stopped',
        data: info,
      });
    } catch (error: any) {
      console.error('Stop capture error:', error);
      if (error.message.includes('No active capture')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to stop capture' });
      }
    }
  }

  public static pauseCapture(req: Request, res: Response): void {
    const { interface: interfaceName } = req.body;

    if (!interfaceName) {
      res.status(400).json({ error: 'Interface name is required' });
      return;
    }

    try {
      CaptureService.pauseCapture(interfaceName);
      res.status(200).json({ message: 'Capture paused' });
    } catch (error: any) {
      console.error('Pause capture error:', error);
      if (error.message.includes('No active capture')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to pause capture' });
      }
    }
  }

  public static resumeCapture(req: Request, res: Response): void {
    const { interface: interfaceName } = req.body;

    if (!interfaceName) {
      res.status(400).json({ error: 'Interface name is required' });
      return;
    }

    try {
      CaptureService.resumeCapture(interfaceName);
      res.status(200).json({ message: 'Capture resumed' });
    } catch (error: any) {
      console.error('Resume capture error:', error);
      if (error.message.includes('No active capture')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to resume capture' });
      }
    }
  }

  public static getStats(req: Request, res: Response): void {
    const { interface: interfaceName } = req.query;

    if (!interfaceName || typeof interfaceName !== 'string') {
      res
        .status(400)
        .json({ error: 'Interface name is required (query param: interface)' });
      return;
    }

    try {
      const stats = CaptureService.getCaptureStats(interfaceName);
      res.status(200).json(stats);
    } catch (error: any) {
      if (error.message.includes('No active capture')) {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get capture stats' });
      }
    }
  }

  public static downloadCapture(req: Request, res: Response): void {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Capture ID is required' });
      return;
    }

    // Basic path traversal prevention
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      res.status(400).json({ error: 'Invalid capture ID' });
      return;
    }

    const fs = require('fs');
    const path = require('path');

    // Allow ID to be just UUID or filename
    let filename = id;
    if (!filename.endsWith('.pcap')) {
      filename += '.pcap';
    }

    const filePath = path.join(StorageService.getCaptureDir(), filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Capture file not found' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.tcpdump.pcap');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error: any) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  }

  public static listSessions(req: Request, res: Response): void {
    try {
      const sessions = CaptureService.getSessions();
      res.json(sessions);
    } catch (error) {
      // Error handler should catch this ideally if logic fails, but for now manual try/catch or just let it bubble
      // Since method is static and simple, just res.json
      console.error('List sessions error', error);
      res.status(500).json({ error: 'Failed to list sessions' });
    }
  }
}
