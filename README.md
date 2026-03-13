<div align="center">

<br/>

```
██████╗  ██████╗  ██████╗██╗   ██╗███╗   ███╗██╗███╗   ██╗██████╗
██╔══██╗██╔═══██╗██╔════╝██║   ██║████╗ ████║██║████╗  ██║██╔══██╗
██║  ██║██║   ██║██║     ██║   ██║██╔████╔██║██║██╔██╗ ██║██║  ██║
██║  ██║██║   ██║██║     ██║   ██║██║╚██╔╝██║██║██║╚██╗██║██║  ██║
██████╔╝╚██████╔╝╚██████╗╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
╚═════╝  ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝
```

### **Your documents. Your answers. Zero hallucination.**

*An AI-powered document intelligence app built on RAG — ask anything about your PDFs, Word docs, and text files and get precise, cited answers in real time.*

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-black?style=for-the-badge&logo=typescript&logoColor=3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-black?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)
![Google Gemini](https://img.shields.io/badge/Gemini_AI-black?style=for-the-badge&logo=google&logoColor=4285F4)
![SQLite](https://img.shields.io/badge/SQLite-black?style=for-the-badge&logo=sqlite&logoColor=003B57)

<br/>

</div>

---

## ✦ What is DocuMind?

DocuMind is a **document intelligence platform** that lets you upload any document and have a real conversation with it. Under the hood it uses **RAG (Retrieval-Augmented Generation)** — a production-grade AI architecture that retrieves only the most relevant parts of your document before generating an answer.

No more scrolling through 200-page PDFs. Just ask.

```
You  →  "What are the key risks identified in Q4?"
         ↓
         DocuMind embeds your question
         DocuMind finds the 6 most relevant chunks from your doc
         DocuMind sends them to Gemini with a strict grounding prompt
         ↓
AI   →  "Three key risks were identified: (1) Supply chain delays
         (Page 12), (2) Regulatory uncertainty in EU markets (Page
         34), and (3) Engineering headcount gaps (Page 47)."
```

Answers are **always grounded in your documents**. If the answer isn't there, DocuMind says so.

---

## ✦ Features

|  | Feature | Description |
|--|---------|-------------|
| 📄 | **Multi-format support** | PDF, DOCX, DOC, TXT, Markdown |
| 🧠 | **RAG pipeline** | Chunking → Embeddings → Semantic retrieval → Grounded generation |
| ⚡ | **Streaming answers** | Token-by-token streaming, like ChatGPT — no waiting |
| 📎 | **Source citations** | Every answer cites the exact page numbers it drew from |
| 🔍 | **Cross-doc search** | Ask questions that span multiple uploaded documents |
| 🗑️ | **Optimistic deletes** | Documents vanish instantly from the UI, no loading spinner |
| 🖱️ | **Drag & drop upload** | Drop files directly onto the UI |
| 💾 | **Zero-setup database** | SQLite — no external DB server, everything lives in a file |

---

## ✦ Tech Stack

```
Frontend         Next.js 16 App Router + React 19 + TypeScript
Styling          Tailwind CSS v4
AI Models        Gemini 2.5 Flash  (generation)
                 Gemini Embedding-001  (3072-dim vectors)
Database         SQLite via better-sqlite3 (WAL mode)
File Parsing     pdf-parse (PDFs) · mammoth (DOCX) · native Buffer (TXT/MD)
```

---

## ✦ Architecture

```
                         ┌─────────────────────────────┐
                         │         UPLOAD FLOW          │
                         └─────────────────────────────┘

  File (PDF/DOCX/TXT)
        │
        ▼
  extractAndChunk()          400-word chunks, 50-word overlap
        │                    page number tagged on every chunk
        ▼
  generateEmbedding()        Gemini embedding-001
        │                    float[3072] per chunk
        ▼
  SQLite — chunks table      embedding stored as JSON string


                         ┌─────────────────────────────┐
                         │          QUERY FLOW          │
                         └─────────────────────────────┘

  User question
        │
        ▼
  generateEmbedding()        embed the question → float[3072]
        │
        ▼
  cosineSimilarity()         scored against every chunk in DB
        │                    threshold: 0.25 · top-6 selected
        ▼
  generateStreamedAnswer()   Gemini 2.5 Flash with grounded prompt
        │
        ▼
  ReadableStream →           streamed token-by-token to browser
  X-Sources header           page citations delivered before stream body
```

---

## ✦ Getting Started

### Prerequisites

- **Node.js** 18+
- A free **Gemini API key** → [Get one at Google AI Studio](https://aistudio.google.com/app/apikey)

### 1 — Clone the repo

```bash
git clone https://github.com/sujxth0304/DocuMind.git
cd DocuMind
```

### 2 — Install dependencies

```bash
npm install
```

### 3 — Add your API key

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4 — Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app is live.

> The SQLite database (`data/documind.db`) is created automatically on first run. No setup needed.

---

## ✦ Project Structure

```
documind/
├── app/
│   ├── api/
│   │   ├── chat/route.ts            POST /api/chat — RAG pipeline
│   │   └── documents/
│   │       ├── route.ts             GET + POST /api/documents
│   │       └── [id]/route.ts        DELETE /api/documents/:id
│   ├── app/
│   │   ├── dashboard/page.tsx       Overview & quick actions
│   │   ├── documents/page.tsx       Upload, list, delete documents
│   │   └── questions/page.tsx       Streaming chat interface
│   ├── components/
│   │   ├── app/                     AppShell · Sidebar · Topbar
│   │   ├── marketing/               Hero · Features · CTA
│   │   └── ui/                      Button · Card · Skeleton
│   └── marketing/page.tsx           Landing page
├── lib/
│   ├── db.ts                        SQLite singleton + schema + migrations
│   ├── ai.ts                        Embeddings · cosine similarity · streaming
│   └── extraction.ts                PDF/DOCX/TXT parsing + chunking
├── data/                            SQLite database (git-ignored)
└── next.config.ts                   Server external packages config
```

---

## ✦ How RAG Works (Plain English)

**RAG = Retrieval-Augmented Generation**

Traditional chatbots answer from their training data — they can hallucinate, go out of date, or not know about your private documents.

RAG fixes this in three steps:

1. **Index**: Split the document into chunks. Convert each chunk to a vector (embedding) that captures its *meaning* as a list of numbers.

2. **Retrieve**: When a question comes in, convert it to a vector too. Use cosine similarity to find the chunks whose vectors are closest to the question vector — those are the most relevant passages.

3. **Generate**: Feed only those passages to the LLM alongside the question and a strict prompt: *"Answer using ONLY what's in these excerpts."*

The LLM never guesses. It only summarises and cites what was found.

---

## ✦ API Reference

### `POST /api/documents`
Upload a document. Returns the created document record.

```
Content-Type: multipart/form-data
Body: { file: File }
```

### `GET /api/documents`
List all documents ordered by most recent.

### `DELETE /api/documents/:id`
Delete a document and all its chunks (CASCADE).

### `POST /api/chat`
Ask a question. Returns a streaming plain-text response.

```json
{
  "question": "What are the main findings?",
  "documentId": "optional-uuid-to-scope-to-one-doc"
}
```

Response headers include `X-Sources` — a JSON array of cited documents and page numbers.

---

## ✦ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio API key |

---

## ✦ Roadmap

- [ ] Authentication (NextAuth)
- [ ] PostgreSQL + pgvector for production-scale vector search
- [ ] S3/GCS for file storage
- [ ] Background job queue for async embedding (no upload timeouts)
- [ ] Conversation history persistence
- [ ] Multi-workspace support
- [ ] Export answers as PDF / Markdown

---

## ✦ License

MIT © [Sujith Santhosh](https://github.com/sujxth0304)

---

<div align="center">

*Built with Next.js · Powered by Gemini · Zero compromise on accuracy*

</div>
