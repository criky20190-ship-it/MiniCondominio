import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AppError('Token non trovato', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = (decoded as any).userId;
    req.user = decoded;
    
    next();
  } catch (error) {
    next(new AppError('Token non valido', 401));
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.userId = (decoded as any).userId;
      req.user = decoded;
    }
  } catch (error) {
    // Continue without auth
  }
  
  next();
};
