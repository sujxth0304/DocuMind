import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  generateEmbedding,
  cosineSimilarity,
  generateStreamedAnswer,
  type ContextChunk,
} from '@/lib/ai';

interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  page_number: number;
  embedding: string; // JSON-serialised float[]
  document_name: string;
}

interface SourceInfo {
  documentId: string;
  documentName: string;
  pages: number[];
}

/**
 * POST /api/chat
 * Body: { question: string; documentId?: string }
 *
 * 1. Embeds the question
 * 2. Ranks chunks by cosine similarity (threshold + top-6)
 * 3. Returns X-Sources header with cited pages per document
 * 4. Streams the grounded answer from Gemini
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question: string = body.question ?? '';
    const documentId: string | undefined = body.documentId;

    if (!question.trim()) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    // Fetch chunks joined with document name
    const chunks = (
      documentId
        ? db
            .prepare(
              `SELECT c.*, d.name AS document_name
               FROM chunks c
               JOIN documents d ON c.document_id = d.id
               WHERE c.document_id = ?`
            )
            .all(documentId)
        : db
            .prepare(
              `SELECT c.*, d.name AS document_name
               FROM chunks c
               JOIN documents d ON c.document_id = d.id`
            )
            .all()
    ) as ChunkRow[];

    if (chunks.length === 0) {
      const msg = documentId
        ? 'This document has no indexed content. It may still be processing or failed to parse.'
        : 'No documents have been uploaded yet. Please upload a document first.';

      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(msg));
            controller.close();
          },
        }),
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // Embed question and score every chunk
    const questionEmbedding = await generateEmbedding(question);

    const scored = chunks.map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(questionEmbedding, JSON.parse(chunk.embedding)),
    }));

    scored.sort((a, b) => b.similarity - a.similarity);

    // Keep chunks above the similarity threshold (min 3 fallback)
    const THRESHOLD = 0.25;
    let topChunks = scored.filter((c) => c.similarity >= THRESHOLD).slice(0, 6);
    if (topChunks.length === 0) topChunks = scored.slice(0, 3);

    // Build deduplicated source map: { documentId → { name, sorted pages[] } }
    const sourceMap = new Map<string, SourceInfo>();
    for (const c of topChunks) {
      const existing = sourceMap.get(c.document_id);
      if (existing) {
        if (!existing.pages.includes(c.page_number)) existing.pages.push(c.page_number);
      } else {
        sourceMap.set(c.document_id, {
          documentId: c.document_id,
          documentName: c.document_name,
          pages: [c.page_number],
        });
      }
    }
    for (const src of sourceMap.values()) src.pages.sort((a, b) => a - b);
    const sources = Array.from(sourceMap.values());

    // Build rich context for AI
    const contextChunks: ContextChunk[] = topChunks.map((c) => ({
      content: c.content,
      pageNumber: c.page_number,
      documentName: c.document_name,
      documentId: c.document_id,
    }));

    const stream = await generateStreamedAnswer(question, contextChunks);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        // Expose sources so the frontend can render citations
        'X-Sources': JSON.stringify(sources),
        'Access-Control-Expose-Headers': 'X-Sources',
      },
    });
  } catch (err) {
    console.error('POST /api/chat error:', err);
    const message = err instanceof Error ? err.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
