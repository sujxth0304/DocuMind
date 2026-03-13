import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db from '@/lib/db';
import { extractAndChunk } from '@/lib/extraction';
import { generateEmbedding } from '@/lib/ai';

interface DocumentRow {
  id: string;
  name: string;
  size: string;
  pages: number;
  type: string;
  status: string;
  created_at: number;
}

/** GET /api/documents — List all documents ordered by newest first */
export async function GET() {
  try {
    const docs = db
      .prepare('SELECT * FROM documents ORDER BY created_at DESC')
      .all() as DocumentRow[];
    return NextResponse.json(docs);
  } catch (err) {
    console.error('GET /api/documents error:', err);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

/** POST /api/documents — Upload, extract, chunk, embed, and store a document */
export async function POST(request: NextRequest) {
  const id = randomUUID();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine display size
    const bytes = file.size;
    const size =
      bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${(bytes / 1024).toFixed(0)} KB`;

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'file';

    // 1. Insert document record as "processing"
    db.prepare(
      `INSERT INTO documents (id, name, size, type, status) VALUES (?, ?, ?, ?, 'processing')`
    ).run(id, file.name, size, ext);

    // 2. Extract text + build page-tagged chunks in one step
    const buffer = Buffer.from(await file.arrayBuffer());
    const { pages, chunks } = await extractAndChunk(buffer, file.name);

    if (chunks.length === 0) {
      db.prepare(`UPDATE documents SET status = 'error' WHERE id = ?`).run(id);
      return NextResponse.json(
        { error: 'Could not extract readable text from this document.' },
        { status: 422 }
      );
    }

    // 3. Embed each chunk and store with its page number
    const insertChunk = db.prepare(
      `INSERT INTO chunks (id, document_id, content, chunk_index, page_number, embedding)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);
      insertChunk.run(
        randomUUID(),
        id,
        chunk.text,
        chunk.chunkIndex,
        chunk.pageNumber,
        JSON.stringify(embedding)
      );
    }

    // 4. Mark document as ready
    db.prepare(`UPDATE documents SET status = 'ready', pages = ? WHERE id = ?`).run(pages, id);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error('POST /api/documents error:', err);
    try {
      db.prepare(`UPDATE documents SET status = 'error' WHERE id = ?`).run(id);
    } catch (_) { /* ignore */ }

    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
