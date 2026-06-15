import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Register user
router.post('/register', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, name, googleId, picture } = req.body;
    
    if (!email || !name) {
      throw new AppError('Email e nome sono obbligatori', 400);
    }
    
    const db = await getDatabase();
    
    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      const token = jwt.sign(
        { userId: existingUser.id, email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      
      return res.json({ token, user: existingUser });
    }
    
    // Create new user
    const result = await db.run(
      `INSERT INTO users (email, name, google_id, picture) VALUES (?, ?, ?, ?)`,
      [email, name, googleId || null, picture || null]
    );
    
    const token = jwt.sign(
      { userId: result.lastID, email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.status(201).json({
      token,
      user: { id: result.lastID, email, name }
    });
  } catch (error) {
    next(error);
  }
});

// Google OAuth callback
router.post('/google', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, name, googleId, picture } = req.body;
    
    if (!email || !googleId) {
      throw new AppError('Email e Google ID sono obbligatori', 400);
    }
    
    const db = await getDatabase();
    
    // Find or create user
    let user = await db.get('SELECT * FROM users WHERE google_id = ?', [googleId]);
    
    if (!user) {
      const result = await db.run(
        `INSERT INTO users (email, name, google_id, picture) VALUES (?, ?, ?, ?)`,
        [email, name, googleId, picture || null]
      );
      user = { id: result.lastID, email, name, google_id: googleId, picture };
    } else {
      // Update user info
      await db.run(
        `UPDATE users SET name = ?, picture = ? WHERE id = ?`,
        [name, picture || null, user.id]
      );
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('Non autenticato', 401);
    }
    
    const db = await getDatabase();
    const user = await db.get('SELECT id, email, name, picture, is_admin FROM users WHERE id = ?', [req.userId]);
    
    if (!user) {
      throw new AppError('Utente non trovato', 404);
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
