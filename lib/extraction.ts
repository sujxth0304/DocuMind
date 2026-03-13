import { PDFParse } from 'pdf-parse';

export interface PagedChunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
}

/**
 * Extracts text from a document and splits it into page-tagged chunks.
 * Supports PDF, DOCX, DOC, TXT, and MD.
 */
export async function extractAndChunk(
  buffer: Buffer,
  filename: string,
  maxWords = 400,
  overlapWords = 50
): Promise<{ pages: number; chunks: PagedChunk[] }> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  let pageTexts: Array<{ num: number; text: string }>;
  let totalPages: number;

  if (ext === 'pdf') {
    ({ pageTexts, totalPages } = await extractPdfPages(buffer));
  } else if (ext === 'docx' || ext === 'doc') {
    ({ pageTexts, totalPages } = await extractDocxPages(buffer));
  } else if (ext === 'txt' || ext === 'md') {
    ({ pageTexts, totalPages } = extractPlainTextPages(buffer));
  } else {
    throw new Error(
      `Unsupported file type: .${ext}. Please upload PDF, DOCX, TXT, or MD files.`
    );
  }

  const allText = pageTexts.map((p) => p.text).join(' ');
  if (allText.trim().length < 10) {
    throw new Error('Could not extract readable text from this document.');
  }

  const chunks: PagedChunk[] = [];
  let globalIndex = 0;

  for (const page of pageTexts) {
    const pageChunks = splitIntoChunks(page.text, maxWords, overlapWords);
    for (const chunkText of pageChunks) {
      chunks.push({ text: chunkText, pageNumber: page.num, chunkIndex: globalIndex++ });
    }
  }

  return { pages: totalPages, chunks };
}

async function extractPdfPages(
  buffer: Buffer
): Promise<{ pageTexts: Array<{ num: number; text: string }>; totalPages: number }> {
  const parser = new PDFParse({ data: buffer, verbosity: 0 });
  try {
    // pageJoiner: '' prevents pdf-parse from adding page-break markers to result.text
    const result = await parser.getText({ pageJoiner: '' });

    // result.pages is Array<{num: number, text: string}> — exactly what we need
    const pageTexts = result.pages
      .filter((p) => p.text && p.text.trim().length > 0)
      .map((p) => ({ num: p.num, text: p.text }));

    // Fallback: pages array empty but full text exists
    if (pageTexts.length === 0 && result.text && result.text.trim().length > 0) {
      pageTexts.push({ num: 1, text: result.text });
    }

    return { pageTexts, totalPages: result.total };
  } catch (err) {
    console.error('PDF parse error:', err);
    throw new Error('Failed to parse PDF. The file may be encrypted or malformed.');
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function extractDocxPages(
  buffer: Buffer
): Promise<{ pageTexts: Array<{ num: number; text: string }>; totalPages: number }> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();

  if (!text) {
    throw new Error('Could not extract text from DOCX. The file may be empty or corrupted.');
  }

  // Estimate ~3 000 chars per page
  const totalPages = Math.max(1, Math.ceil(text.length / 3000));
  const charsPerPage = Math.ceil(text.length / totalPages);

  const pageTexts: Array<{ num: number; text: string }> = [];
  for (let i = 0; i < totalPages; i++) {
    const slice = text.slice(i * charsPerPage, (i + 1) * charsPerPage).trim();
    if (slice) pageTexts.push({ num: i + 1, text: slice });
  }

  return { pageTexts, totalPages };
}

function extractPlainTextPages(
  buffer: Buffer
): { pageTexts: Array<{ num: number; text: string }>; totalPages: number } {
  const text = buffer.toString('utf-8').trim();

  if (!text) {
    throw new Error('The text file appears to be empty.');
  }

  const totalPages = Math.max(1, Math.ceil(text.length / 3000));
  const charsPerPage = Math.ceil(text.length / totalPages);

  const pageTexts: Array<{ num: number; text: string }> = [];
  for (let i = 0; i < totalPages; i++) {
    const slice = text.slice(i * charsPerPage, (i + 1) * charsPerPage).trim();
    if (slice) pageTexts.push({ num: i + 1, text: slice });
  }

  return { pageTexts, totalPages };
}

function splitIntoChunks(text: string, maxWords: number, overlapWords: number): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter((w) => w.length > 0);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    const chunk = words.slice(start, end).join(' ').trim();
    if (chunk.length > 30) chunks.push(chunk);
    if (end === words.length) break;
    start += maxWords - overlapWords;
  }

  return chunks;
}
