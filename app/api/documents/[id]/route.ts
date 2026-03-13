import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/** DELETE /api/documents/[id] — hard-deletes document and all its chunks (via FK CASCADE) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = db.prepare('SELECT id FROM documents WHERE id = ?').get(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Chunks are deleted automatically by ON DELETE CASCADE
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/documents/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
