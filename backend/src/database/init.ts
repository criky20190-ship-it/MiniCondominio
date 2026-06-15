import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;
  
  db = await open({
    filename: process.env.DATABASE_URL || './data/condominio.db',
    driver: sqlite3.Database
  });
  
  await db.exec('PRAGMA foreign_keys = ON');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();
  
  // Users table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      picture TEXT,
      google_id TEXT UNIQUE,
      role TEXT DEFAULT 'user',
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Palazzine (condomini) table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS palazzine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT,
      phone TEXT,
      email TEXT,
      admin_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    )
  `);
  
  // Appartamenti table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS appartamenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      palazzina_id INTEGER NOT NULL,
      numero TEXT NOT NULL,
      piano TEXT,
      proprietario_name TEXT NOT NULL,
      proprietario_email TEXT NOT NULL,
      proprietario_phone TEXT,
      quota_millesimi REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (palazzina_id) REFERENCES palazzine(id),
      UNIQUE(palazzina_id, numero)
    )
  `);
  
  // Spese comuni table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS spese (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      palazzina_id INTEGER NOT NULL,
      descrizione TEXT NOT NULL,
      importo REAL NOT NULL,
      data_spesa DATE NOT NULL,
      categoria TEXT,
      documento_url TEXT,
      note TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (palazzina_id) REFERENCES palazzine(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  
  // Pagamenti spese table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS pagamenti_spese (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spesa_id INTEGER NOT NULL,
      appartamento_id INTEGER NOT NULL,
      importo REAL NOT NULL,
      stato TEXT DEFAULT 'pendente',
      data_pagamento DATE,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (spesa_id) REFERENCES spese(id),
      FOREIGN KEY (appartamento_id) REFERENCES appartamenti(id)
    )
  `);
  
  // Comunicazioni table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS comunicazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      palazzina_id INTEGER NOT NULL,
      titolo TEXT NOT NULL,
      contenuto TEXT NOT NULL,
      published_by INTEGER NOT NULL,
      tipo TEXT DEFAULT 'informazione',
      importante INTEGER DEFAULT 0,
      data_inizio DATE,
      data_fine DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (palazzina_id) REFERENCES palazzine(id),
      FOREIGN KEY (published_by) REFERENCES users(id)
    )
  `);
  
  // Documenti table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS documenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      palazzina_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      descrizione TEXT,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      categoria TEXT,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (palazzina_id) REFERENCES palazzine(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);
  
  // Ruoli utenti per palazzina
  await database.exec(`
    CREATE TABLE IF NOT EXISTS utenti_palazzine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      palazzina_id INTEGER NOT NULL,
      ruolo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, palazzina_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (palazzina_id) REFERENCES palazzine(id)
    )
  `);
  
  console.log('✅ Database schema initialized');
}
