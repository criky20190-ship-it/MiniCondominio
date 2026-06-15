import express, { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get comunicazioni for palazzina
router.get('/palazzina/:palazzinaId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const comunicazioni = await db.all(
      `SELECT c.*, u.name as autore_name FROM comunicazioni c
       LEFT JOIN users u ON c.published_by = u.id
       WHERE c.palazzina_id = ?
       ORDER BY c.importante DESC, c.created_at DESC`,
      [req.params.palazzinaId]
    );
    
    res.json(comunicazioni);
  } catch (error) {
    next(error);
  }
});

// Create comunicazione
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { palazzina_id, titolo, contenuto, tipo, importante, data_inizio, data_fine } = req.body;
    
    if (!palazzina_id || !titolo || !contenuto) {
      throw new AppError('Dati obbligatori mancanti', 400);
    }
    
    const db = await getDatabase();
    
    const result = await db.run(
      `INSERT INTO comunicazioni (palazzina_id, titolo, contenuto, tipo, importante, data_inizio, data_fine, published_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [palazzina_id, titolo, contenuto, tipo || 'informazione', importante ? 1 : 0, data_inizio || null, data_fine || null, req.userId]
    );
    
    const comunicazione = await db.get('SELECT * FROM comunicazioni WHERE id = ?', [result.lastID]);
    res.status(201).json(comunicazione);
  } catch (error) {
    next(error);
  }
});

// Update comunicazione
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { titolo, contenuto, tipo, importante, data_inizio, data_fine } = req.body;
    const db = await getDatabase();
    
    const comunicazione = await db.get('SELECT * FROM comunicazioni WHERE id = ?', [req.params.id]);
    if (!comunicazione || comunicazione.published_by !== req.userId) {
      throw new AppError('Non autorizzato', 403);
    }
    
    await db.run(
      `UPDATE comunicazioni SET titolo = ?, contenuto = ?, tipo = ?, importante = ?, data_inizio = ?, data_fine = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [titolo || comunicazione.titolo, contenuto || comunicazione.contenuto, tipo || comunicazione.tipo, importante !== undefined ? (importante ? 1 : 0) : comunicazione.importante, data_inizio || comunicazione.data_inizio, data_fine || comunicazione.data_fine, req.params.id]
    );
    
    const updated = await db.get('SELECT * FROM comunicazioni WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete comunicazione
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const comunicazione = await db.get('SELECT * FROM comunicazioni WHERE id = ?', [req.params.id]);
    
    if (!comunicazione || comunicazione.published_by !== req.userId) {
      throw new AppError('Non autorizzato', 403);
    }
    
    await db.run('DELETE FROM comunicazioni WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comunicazione eliminata' });
  } catch (error) {
    next(error);
  }
});

export default router;
