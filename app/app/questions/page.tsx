"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Source {
  documentId: string;
  documentName: string;
  pages: number[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
  isError?: boolean;
}

const SUGGESTED = [
  "Summarize this document",
  "What are the key decisions or conclusions?",
  "What risks or challenges are mentioned?",
  "What are the main recommendations?",
];

function SendIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-5">
      <span className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

/** Renders markdown bold (**text**) and preserves line breaks */
function MessageContent({ content, isError }: { content: string; isError?: boolean }) {
  if (isError) {
    return <p className="text-sm text-red-500 leading-relaxed">{content}</p>;
  }

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-black/80">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="text-black font-semibold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

/** Source citations panel shown below assistant answers */
function SourcesPanel({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-black/8">
      <p className="text-[10px] font-semibold text-black/35 uppercase tracking-wider mb-1.5">
        Sources
      </p>
      <div className="space-y-1">
        {sources.map((src) => (
          <div key={src.documentId} className="flex items-start gap-2 text-xs">
            <span className="text-black/30 mt-0.5 flex-shrink-0">
              <DocIcon />
            </span>
            <span className="text-black/55 font-medium truncate">{src.documentName}</span>
            {src.pages.length > 0 && (
              <span className="text-black/30 flex-shrink-0 ml-auto pl-2">
                {src.pages.length === 1
                  ? `p. ${src.pages[0]}`
                  : `pp. ${src.pages.slice(0, 6).join(", ")}${src.pages.length > 6 ? "…" : ""}`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatInterface({
  documentId,
  docName,
}: {
  documentId: string | null;
  docName: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsgId = `u-${Date.now()}`;
      const aiMsgId = `a-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: trimmed },
      ]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsLoading(true);

      // Placeholder streaming message
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", isStreaming: true },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            documentId: documentId ?? undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Unknown error" }));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: errData.error, isStreaming: false, isError: true }
                : m
            )
          );
          return;
        }

        // Read sources from response header before streaming body
        const sources: Source[] = (() => {
          try {
            const header = res.headers.get("X-Sources");
            return header ? (JSON.parse(header) as Source[]) : [];
          } catch {
            return [];
          }
        })();

        // Attach sources to the message immediately
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, sources } : m))
        );

        // Stream answer token by token
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: accumulated } : m
            )
          );
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content:
                    "Failed to get a response. Please check your connection and API key.",
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, documentId]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center py-16 px-6">
            <div className="max-w-lg w-full space-y-8 text-center">
              <div>
                {docName ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-black/15 text-xs text-black/50 mb-5 max-w-xs truncate">
                      <DocIcon />
                      <span className="truncate">{docName}</span>
                    </div>
                    <h2 className="text-xl font-bold text-black tracking-tight">
                      What would you like to know?
                    </h2>
                    <p className="text-black/40 text-sm mt-2 leading-relaxed">
                      Ask anything — I&apos;ll find the answer from the document content.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-black tracking-tight">
                      Ask about your documents
                    </h2>
                    <p className="text-black/40 text-sm mt-2 leading-relaxed">
                      Questions will search across all indexed documents. Or{" "}
                      <Link
                        href="/app/documents"
                        className="underline underline-offset-2 hover:text-black transition-colors"
                      >
                        select a specific document
                      </Link>{" "}
                      to focus the answer.
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left px-4 py-3 border border-black/10 hover:border-black/30 hover:bg-black/[0.02] transition-colors text-sm text-black/55 hover:text-black"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 flex-shrink-0 bg-black text-white text-[10px] font-bold flex items-center justify-center mt-0.5 select-none">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[78%] px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-black text-white text-sm"
                      : msg.isError
                      ? "bg-red-50 border border-red-100"
                      : "bg-white border border-black/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : msg.isStreaming && !msg.content ? (
                    <TypingDots />
                  ) : (
                    <>
                      <MessageContent content={msg.content} isError={msg.isError} />
                      {/* Streaming cursor */}
                      {msg.isStreaming && msg.content && (
                        <span className="inline-block w-0.5 h-4 bg-black/40 ml-0.5 animate-pulse" />
                      )}
                      {/* Source citations — shown after streaming completes */}
                      {!msg.isStreaming && !msg.isError && msg.sources && msg.sources.length > 0 && (
                        <SourcesPanel sources={msg.sources} />
                      )}
                    </>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 flex-shrink-0 bg-black/8 border border-black/10 text-black text-[10px] font-bold flex items-center justify-center mt-0.5 select-none">
                    U
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-black/10 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto w-full">
          {docName && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-black/30 pl-1">
              <DocIcon />
              <span className="truncate max-w-[300px] text-black/50">{docName}</span>
              <Link
                href="/app/documents"
                className="ml-auto hover:text-black transition-colors underline underline-offset-2 flex-shrink-0"
              >
                Change doc
              </Link>
            </div>
          )}
          <div className="flex items-end gap-3 border border-black/15 bg-white focus-within:border-black/40 transition-colors px-4 py-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={onKeyDown}
              placeholder={
                docName
                  ? `Ask anything about "${docName}"…`
                  : "Ask a question across all your documents…"
              }
              className="flex-1 resize-none bg-transparent text-sm text-black placeholder-black/25 focus:outline-none leading-relaxed"
              style={{ minHeight: "24px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
          <p className="text-center text-black/20 text-[10px] mt-2">
            Answers are grounded in your uploaded documents. ⏎ to send · Shift+⏎ newline
          </p>
        </div>
      </div>
    </div>
  );
}

function QuestionsContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("doc");
  const docName = searchParams.get("name");

  return (
    <div className="flex flex-col h-full -m-8">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-black/10 bg-white flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-black tracking-tight leading-none">
            Questions
          </h1>
          <p className="text-black/40 text-xs mt-0.5">AI-powered document Q&A</p>
        </div>
        <Link
          href="/app/documents"
          className="text-xs font-semibold px-3 py-1.5 border border-black/20 text-black hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Document
        </Link>
      </div>

      <ChatInterface documentId={documentId} docName={docName} />
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-black/30 text-sm">
          Loading…
        </div>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}
