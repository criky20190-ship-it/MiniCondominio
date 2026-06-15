import express, { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

// Get spese for palazzina
router.get('/palazzina/:palazzinaId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const spese = await db.all(
      'SELECT * FROM spese WHERE palazzina_id = ? ORDER BY data_spesa DESC',
      [req.params.palazzinaId]
    );
    
    // Get pagamenti info for each spesa
    for (const spesa of spese) {
      const pagamenti = await db.all(
        'SELECT * FROM pagamenti_spese WHERE spesa_id = ?',
        [spesa.id]
      );
      spesa.pagamenti = pagamenti;
    }
    
    res.json(spese);
  } catch (error) {
    next(error);
  }
});

// Create spesa
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { palazzina_id, descrizione, importo, data_spesa, categoria, documento_url, note } = req.body;
    
    if (!palazzina_id || !descrizione || !importo || !data_spesa) {
      throw new AppError('Dati obbligatori mancanti', 400);
    }
    
    const db = await getDatabase();
    
    // Start transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      const result = await db.run(
        `INSERT INTO spese (palazzina_id, descrizione, importo, data_spesa, categoria, documento_url, note, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [palazzina_id, descrizione, importo, data_spesa, categoria || null, documento_url || null, note || null, req.userId]
      );
      
      // Create pagamenti entries for each appartamento
      const appartamenti = await db.all(
        'SELECT id, quota_millesimi FROM appartamenti WHERE palazzina_id = ?',
        [palazzina_id]
      );
      
      // Calculate total millesimi
      const totalMillesimi = appartamenti.reduce((sum: number, a: any) => sum + (a.quota_millesimi || 0), 0);
      
      for (const app of appartamenti) {
        const quota = totalMillesimi > 0 ? (app.quota_millesimi / totalMillesimi) : 0;
        const importoQuota = importo * quota;
        
        await db.run(
          `INSERT INTO pagamenti_spese (spesa_id, appartamento_id, importo, stato)
           VALUES (?, ?, ?, 'pendente')`,
          [result.lastID, app.id, importoQuota]
        );
      }
      
      await db.exec('COMMIT');
      
      const spesa = await db.get('SELECT * FROM spese WHERE id = ?', [result.lastID]);
      const pagamenti = await db.all('SELECT * FROM pagamenti_spese WHERE spesa_id = ?', [result.lastID]);
      spesa.pagamenti = pagamenti;
      
      res.status(201).json(spesa);
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Update pagamento status
router.put('/pagamento/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stato, data_pagamento, note } = req.body;
    const db = await getDatabase();
    
    await db.run(
      `UPDATE pagamenti_spese SET stato = ?, data_pagamento = ?, note = ? WHERE id = ?`,
      [stato || 'pendente', data_pagamento || null, note || null, req.params.id]
    );
    
    const pagamento = await db.get('SELECT * FROM pagamenti_spese WHERE id = ?', [req.params.id]);
    res.json(pagamento);
  } catch (error) {
    next(error);
  }
});

// Get saldo for appartamento
router.get('/saldo/:appartamentoId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    
    const result = await db.get(`
      SELECT 
        SUM(CASE WHEN stato = 'pendente' THEN importo ELSE 0 END) as saldo_pendente,
        SUM(CASE WHEN stato = 'pagato' THEN importo ELSE 0 END) as saldo_pagato,
        SUM(importo) as saldo_totale
      FROM pagamenti_spese
      WHERE appartamento_id = ?
    `, [req.params.appartamentoId]);
    
    res.json(result || { saldo_pendente: 0, saldo_pagato: 0, saldo_totale: 0 });
  } catch (error) {
    next(error);
  }
});

export default router;
