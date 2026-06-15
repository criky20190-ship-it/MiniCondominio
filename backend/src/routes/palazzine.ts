import express, { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get all palazzine for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    
    const palazzine = await db.all(`
      SELECT DISTINCT p.* FROM palazzine p
      LEFT JOIN utenti_palazzine up ON p.id = up.palazzina_id
      WHERE p.admin_id = ? OR up.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.userId, req.userId]);
    
    res.json(palazzine);
  } catch (error) {
    next(error);
  }
});

// Get single palazzina
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const palazzina = await db.get('SELECT * FROM palazzine WHERE id = ?', [req.params.id]);
    
    if (!palazzina) {
      throw new AppError('Palazzina non trovata', 404);
    }
    
    res.json(palazzina);
  } catch (error) {
    next(error);
  }
});

// Create palazzina
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, postal_code, phone, email } = req.body;
    
    if (!name || !address || !city) {
      throw new AppError('Nome, indirizzo e città sono obbligatori', 400);
    }
    
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO palazzine (name, address, city, postal_code, phone, email, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, address, city, postal_code || null, phone || null, email || null, req.userId]
    );
    
    const palazzina = await db.get('SELECT * FROM palazzine WHERE id = ?', [result.lastID]);
    
    res.status(201).json(palazzina);
  } catch (error) {
    next(error);
  }
});

// Update palazzina
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, postal_code, phone, email } = req.body;
    const db = await getDatabase();
    
    const palazzina = await db.get('SELECT * FROM palazzine WHERE id = ?', [req.params.id]);
    if (!palazzina || palazzina.admin_id !== req.userId) {
      throw new AppError('Non autorizzato', 403);
    }
    
    await db.run(
      `UPDATE palazzine SET name = ?, address = ?, city = ?, postal_code = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name || palazzina.name, address || palazzina.address, city || palazzina.city, postal_code || palazzina.postal_code, phone || palazzina.phone, email || palazzina.email, req.params.id]
    );
    
    const updated = await db.get('SELECT * FROM palazzine WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete palazzina
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const palazzina = await db.get('SELECT * FROM palazzine WHERE id = ?', [req.params.id]);
    
    if (!palazzina || palazzina.admin_id !== req.userId) {
      throw new AppError('Non autorizzato', 403);
    }
    
    await db.run('DELETE FROM palazzine WHERE id = ?', [req.params.id]);
    res.json({ message: 'Palazzina eliminata' });
  } catch (error) {
    next(error);
  }
});

export default router;
