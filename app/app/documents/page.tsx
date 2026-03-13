"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface Doc {
  id: string;
  name: string;
  size: string;
  pages: number;
  type: string;
  status: "processing" | "ready" | "error";
  created_at: number;
}

interface UploadingFile {
  name: string;
  progress: "uploading" | "embedding";
}

function FileTypeLabel({ type }: { type: string }) {
  return (
    <div className="w-9 h-9 flex items-center justify-center border border-black/15 bg-white text-[10px] font-bold text-black/40 uppercase tracking-wider flex-shrink-0 select-none">
      {type.slice(0, 4)}
    </div>
  );
}

function StatusBadge({ status }: { status: Doc["status"] }) {
  if (status === "ready")
    return (
      <span className="text-xs font-medium text-black/40 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-black/40 inline-block" />
        Ready
      </span>
    );
  if (status === "processing")
    return (
      <span className="text-xs font-medium text-black/30 flex items-center gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-black/25 inline-block" />
        Processing…
      </span>
    );
  return (
    <span className="text-xs font-medium text-red-500 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
      Error
    </span>
  );
}

function UploadingRow({ file }: { file: UploadingFile }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-white">
      <div className="w-9 h-9 flex items-center justify-center border border-dashed border-black/20 flex-shrink-0">
        <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">{file.name}</p>
        <p className="text-xs text-black/30 mt-0.5 animate-pulse">
          {file.progress === "uploading" ? "Extracting text…" : "Generating embeddings…"}
        </p>
      </div>
      <span className="text-xs text-black/25">Uploading</span>
    </div>
  );
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch");
      setDocs(await res.json());
    } catch {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleFiles = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      const uploadEntry: UploadingFile = { name: file.name, progress: "uploading" };
      setUploading((prev) => [...prev, uploadEntry]);

      try {
        // Short delay so user sees "Extracting" first, then switch to embedding label
        setTimeout(() => {
          setUploading((prev) =>
            prev.map((u) => (u.name === file.name ? { ...u, progress: "embedding" } : u))
          );
        }, 1500);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/documents", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
        } else {
          setDocs((prev) => [data, ...prev]);
        }
      } catch {
        setError("Upload failed. Check your network and try again.");
      } finally {
        setUploading((prev) => prev.filter((u) => u.name !== file.name));
      }
    }
  }, []);

  const deleteDoc = useCallback(async (id: string) => {
    // Optimistically remove from UI
    setDocs((prev) => prev.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Re-fetch to restore if delete failed
        fetchDocs();
      }
    } catch {
      fetchDocs();
    }
  }, [fetchDocs]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const isEmpty = docs.length === 0 && uploading.length === 0 && !loading;

  return (
    <div className="max-w-4xl space-y-10">
      {/* Header */}
      <div className="border-b border-black/10 pb-6">
        <h1 className="text-2xl font-bold text-black tracking-tight">Documents</h1>
        <p className="text-black/40 text-sm mt-1">
          Upload documents — DocuMind will index them so you can ask questions about
          their content.
        </p>
      </div>

      {/* API key warning */}
      {error && (
        <div className="border border-red-200 bg-red-50 px-5 py-3 flex items-start justify-between gap-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed transition-colors duration-200 cursor-pointer p-12 text-center ${
          dragging
            ? "border-black bg-black/[0.02]"
            : "border-black/15 hover:border-black/30 hover:bg-black/[0.01]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="space-y-3 pointer-events-none">
          <div className="w-10 h-10 border border-black/20 flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-black">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-black/40 mt-1">
              PDF, DOCX, TXT, MD — up to 50 MB each
            </p>
          </div>
        </div>
      </div>

      {/* Document list */}
      {(docs.length > 0 || uploading.length > 0 || loading) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black tracking-tight">
              {loading ? "Loading…" : `${docs.length} Document${docs.length !== 1 ? "s" : ""}`}
            </h2>
            <span className="text-xs text-black/30">
              {docs.filter((d) => d.status === "ready").length} ready
            </span>
          </div>

          <div className="divide-y divide-black/10 border border-black/10">
            {/* In-progress uploads */}
            {uploading.map((u) => (
              <UploadingRow key={u.name} file={u} />
            ))}

            {/* Stored documents */}
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-black/[0.01] transition-colors group"
              >
                <FileTypeLabel type={doc.type} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-black/30">{doc.size}</span>
                    <span className="text-black/20 text-xs">·</span>
                    <span className="text-xs text-black/30">{doc.pages} pages</span>
                  </div>
                </div>

                <StatusBadge status={doc.status as Doc["status"]} />

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.status === "ready" && (
                    <Link
                      href={`/app/questions?doc=${doc.id}&name=${encodeURIComponent(doc.name)}`}
                      className="text-xs font-semibold text-black px-3 py-1.5 border border-black/20 hover:bg-black hover:text-white transition-colors"
                    >
                      Ask Questions
                    </Link>
                  )}
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="w-7 h-7 flex items-center justify-center text-black/25 hover:text-black transition-colors"
                    aria-label="Delete document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="text-center text-black/25 text-sm py-8">
          No documents yet. Upload one above to get started.
        </div>
      )}
    </div>
  );
}
