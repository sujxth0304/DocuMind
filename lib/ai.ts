import { GoogleGenerativeAI } from '@google/generative-ai';

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not set. Please add it to your .env.local file. Get a free key at https://aistudio.google.com/app/apikey'
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generates a vector embedding for the given text using gemini-embedding-001.
 * Returns a float array (dimension 3072).
 * Note: text-embedding-004 was shut down by Google on Jan 14 2026.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const truncated = text.slice(0, 25000);
  const result = await model.embedContent(truncated);
  return result.embedding.values;
}

/**
 * Cosine similarity between two equal-length vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** A single retrieved context chunk with its source metadata. */
export interface ContextChunk {
  content: string;
  pageNumber: number;
  documentName: string;
  documentId: string;
}

/**
 * Streams a grounded answer from Gemini, citing page numbers / document names.
 * Returns a ReadableStream of UTF-8 encoded text tokens.
 */
export async function generateStreamedAnswer(
  question: string,
  contextChunks: ContextChunk[]
): Promise<ReadableStream<Uint8Array>> {
  const genAI = getClient();
  // gemini-2.0-flash retired March 3 2026 — replaced by gemini-2.5-flash
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const uniqueDocs = new Set(contextChunks.map((c) => c.documentId));
  const isMultiDoc = uniqueDocs.size > 1;

  // Build labelled excerpts so the model can cite them
  const context = contextChunks
    .map((c, i) => {
      const label = isMultiDoc
        ? `[Excerpt ${i + 1} — "${c.documentName}", Page ${c.pageNumber}]`
        : `[Excerpt ${i + 1} — Page ${c.pageNumber}]`;
      return `${label}\n${c.content}`;
    })
    .join('\n\n---\n\n');

  const docContext = isMultiDoc
    ? 'multiple documents'
    : `"${contextChunks[0]?.documentName ?? 'the document'}"`;

  const citationFormat = isMultiDoc
    ? '(Source: "Document Name", Page X)'
    : '(Page X)';

  const prompt = `You are DocuMind, a precise document-intelligence assistant. \
Answer the user's question using ONLY the document excerpts provided below. \
Do not use outside knowledge.

Document(s): ${docContext}

Relevant excerpts:
${context}

User question: ${question}

Rules:
- Answer based strictly on the excerpts above.
- Cite your sources inline using the format: ${citationFormat}
- If the answer is not found in the excerpts, say: \
"I couldn't find that information in the provided documents."
- Be concise, accurate, and well-structured.
- Use **bold** for key terms and bullet points or numbered lists where appropriate.
- Do not repeat the question.

Answer:`;

  const result = await model.generateContentStream(prompt);
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}
