import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DownloadTokenService } from '../services/DownloadTokenService';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check for Authorization header (Bearer Token)
  const authHeader = req.headers.authorization;

  // Standard Bearer Token Logic
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
        return;
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
    }
  }

  // OTP Download Token Logic (Query Param)
  // Check specifically for 'download_token' to be explicit
  if (req.query.download_token && typeof req.query.download_token === 'string') {
    const user = DownloadTokenService.consumeToken(req.query.download_token);
    if (user) {
      req.user = user;
      next();
      return;
    } else {
      res.status(401).json({ error: 'Invalid or expired download token' });
      return;
    }
  }

  // Fallback: No valid auth found
  res.status(401).json({ error: 'Authentication required' });
  return;
};
