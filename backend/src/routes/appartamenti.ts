import express, { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get appartamenti for palazzina
router.get('/palazzina/:palazzinaId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const appartamenti = await db.all(
      'SELECT * FROM appartamenti WHERE palazzina_id = ? ORDER BY piano, numero',
      [req.params.palazzinaId]
    );
    
    res.json(appartamenti);
  } catch (error) {
    next(error);
  }
});

// Create appartamento
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { palazzina_id, numero, piano, proprietario_name, proprietario_email, proprietario_phone, quota_millesimi } = req.body;
    
    if (!palazzina_id || !numero || !proprietario_name || !proprietario_email) {
      throw new AppError('Dati obbligatori mancanti', 400);
    }
    
    const db = await getDatabase();
    
    const result = await db.run(
      `INSERT INTO appartamenti (palazzina_id, numero, piano, proprietario_name, proprietario_email, proprietario_phone, quota_millesimi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [palazzina_id, numero, piano || null, proprietario_name, proprietario_email, proprietario_phone || null, quota_millesimi || 0]
    );
    
    const appartamento = await db.get('SELECT * FROM appartamenti WHERE id = ?', [result.lastID]);
    res.status(201).json(appartamento);
  } catch (error) {
    next(error);
  }
});

// Update appartamento
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { numero, piano, proprietario_name, proprietario_email, proprietario_phone, quota_millesimi } = req.body;
    const db = await getDatabase();
    
    const appartamento = await db.get('SELECT * FROM appartamenti WHERE id = ?', [req.params.id]);
    if (!appartamento) {
      throw new AppError('Appartamento non trovato', 404);
    }
    
    await db.run(
      `UPDATE appartamenti SET numero = ?, piano = ?, proprietario_name = ?, proprietario_email = ?, proprietario_phone = ?, quota_millesimi = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [numero || appartamento.numero, piano || appartamento.piano, proprietario_name || appartamento.proprietario_name, proprietario_email || appartamento.proprietario_email, proprietario_phone || appartamento.proprietario_phone, quota_millesimi !== undefined ? quota_millesimi : appartamento.quota_millesimi, req.params.id]
    );
    
    const updated = await db.get('SELECT * FROM appartamenti WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete appartamento
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM appartamenti WHERE id = ?', [req.params.id]);
    res.json({ message: 'Appartamento eliminato' });
  } catch (error) {
    next(error);
  }
});

export default router;
