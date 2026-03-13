import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(path.join(DATA_DIR, 'documind.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      size TEXT NOT NULL,
      pages INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'processing',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      page_number INTEGER DEFAULT 1,
      embedding TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  // Migration: add page_number to existing databases that lack it
  try {
    db.exec(`ALTER TABLE chunks ADD COLUMN page_number INTEGER DEFAULT 1`);
  } catch (_) {
    // Column already exists — safe to ignore
  }

  // Migration: purge embeddings created with text-embedding-004 (768 dims, shut down Jan 2026).
  // gemini-embedding-001 produces 3072-dim vectors; mixing dimensions breaks similarity search.
  // Detect stale chunks by checking the embedding dimension of any existing row.
  const sample = db.prepare(`SELECT embedding FROM chunks LIMIT 1`).get() as
    | { embedding: string }
    | undefined;
  if (sample?.embedding) {
    try {
      const dims = (JSON.parse(sample.embedding) as number[]).length;
      if (dims !== 3072) {
        // Delete all stale chunks and mark their documents for re-upload
        db.exec(`DELETE FROM chunks`);
        db.exec(`UPDATE documents SET status = 'error' WHERE status = 'ready'`);
        console.log(
          `[db] Purged ${dims}-dim embeddings (stale). Re-upload documents to re-index with gemini-embedding-001 (3072 dims).`
        );
      }
    } catch (_) {
      // Malformed embedding — skip migration
    }
  }

  return db;
}

const db: Database.Database = global.__db ?? createDb();
if (process.env.NODE_ENV !== 'production') global.__db = db;

export default db;
