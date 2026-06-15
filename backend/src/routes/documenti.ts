import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDatabase } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
  file?: Express.Multer.File;
}

// Configure multer
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowed = (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,xls,xlsx,jpg,png').split(',');
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(`Tipo file non consentito. Estensioni consentite: ${allowed.join(', ')}`, 400));
    }
  }
});

// Get documenti for palazzina
router.get('/palazzina/:palazzinaId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const documenti = await db.all(
      `SELECT d.*, u.name as uploaded_by_name FROM documenti d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.palazzina_id = ?
       ORDER BY d.created_at DESC`,
      [req.params.palazzinaId]
    );
    
    res.json(documenti);
  } catch (error) {
    next(error);
  }
});

// Upload documento
router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { palazzina_id, nome, descrizione, categoria } = req.body;
    
    if (!palazzina_id || !req.file) {
      throw new AppError('Dati obbligatori mancanti', 400);
    }
    
    const db = await getDatabase();
    
    const result = await db.run(
      `INSERT INTO documenti (palazzina_id, nome, descrizione, file_path, file_size, file_type, categoria, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [palazzina_id, nome || req.file.originalname, descrizione || null, req.file.filename, req.file.size, req.file.mimetype, categoria || null, req.userId]
    );
    
    const documento = await db.get('SELECT * FROM documenti WHERE id = ?', [result.lastID]);
    res.status(201).json(documento);
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(path.join(uploadDir, req.file.filename), (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    next(error);
  }
});

// Download documento
router.get('/download/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const documento = await db.get('SELECT * FROM documenti WHERE id = ?', [req.params.id]);
    
    if (!documento) {
      throw new AppError('Documento non trovato', 404);
    }
    
    const filePath = path.join(uploadDir, documento.file_path);
    
    if (!fs.existsSync(filePath)) {
      throw new AppError('File non trovato', 404);
    }
    
    res.download(filePath, documento.nome);
  } catch (error) {
    next(error);
  }
});

// Delete documento
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const documento = await db.get('SELECT * FROM documenti WHERE id = ?', [req.params.id]);
    
    if (!documento || documento.uploaded_by !== req.userId) {
      throw new AppError('Non autorizzato', 403);
    }
    
    const filePath = path.join(uploadDir, documento.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await db.run('DELETE FROM documenti WHERE id = ?', [req.params.id]);
    res.json({ message: 'Documento eliminato' });
  } catch (error) {
    next(error);
  }
});

export default router;
