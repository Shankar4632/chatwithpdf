"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Loader2 } from "lucide-react";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import { usePdf } from "./PdfContext";

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key points?",
  "List any dates, deadlines or numbers mentioned",
];

export default function ChatPanel({ className = "" }) {
  const { pdfBase64, fileName, messages, setMessages } = usePdf();
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Grow the composer with its content, up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const ask = async (question) => {
    question = question.trim();
    if (!question || loading || !pdfBase64) return;

    // Only real exchanges go back to the model as context, not error notices.
    const history = messages.filter((m) => !m.error).map(({ role, text }) => ({ role, text }));
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setDraft("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, pdfBase64, history }),
      });
      const data = await res.json().catch(() => ({}));

      setMessages((prev) => [
        ...prev,
        res.ok
          ? { role: "assistant", text: data.answer }
          : { role: "assistant", text: data.error || "Something went wrong.", error: true },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Couldn't reach the server. Check your connection and try again.", error: true },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask(draft);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask(draft);
    }
  };

  return (
    <section className={`min-h-0 flex-col bg-panel ${className}`}>
      <div ref={scrollRef} className="thin-scrollbar flex-1 overflow-y-auto py-4">
        {!pdfBase64 && (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
              <FileText size={22} />
            </span>
            <p className="font-medium text-gray-700">No document yet</p>
            <p className="mt-1 text-sm text-gray-500">Upload a PDF, then ask anything about it.</p>
          </div>
        )}

        {pdfBase64 && messages.length === 0 && (
          <div className="py-2">
            <AssistantMessage text={`I've read **${fileName}**. What would you like to know?`} />
            <div className="mt-1 flex flex-col items-start gap-2 pl-16 pr-5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-left text-sm text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <UserMessage key={i} text={m.text} />
          ) : (
            <AssistantMessage key={i} text={m.text} error={m.error} />
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 px-5 py-3 pl-16 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Reading the PDF…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200/70 p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 pl-4 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!pdfBase64}
            placeholder={pdfBase64 ? "Ask anything about your PDF…" : "Upload a PDF to start chatting"}
            aria-label="Your question"
            className="max-h-40 flex-1 resize-none bg-transparent py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !pdfBase64 || !draft.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-400">
          AI answers can be wrong. Check important details in the document.
        </p>
      </form>
    </section>
  );
}
