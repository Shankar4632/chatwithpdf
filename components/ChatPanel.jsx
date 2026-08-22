"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import { usePdf } from "./PdfContext";

export default function ChatPanel() {
  const { pdfBase64 } = usePdf();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = draft.trim();
    if (!question) return;

    if (!pdfBase64) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: question },
        { role: "assistant", intro: "Upload a PDF first, then ask me about it." },
      ]);
      setDraft("");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setDraft("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, pdfBase64 }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          intro: res.ok ? data.answer : data.error || "Something went wrong.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", intro: "Couldn't reach the AI model. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex w-full max-w-md shrink-0 flex-col bg-panel">
      <div className="thin-scrollbar flex-1 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="px-6 py-3 text-sm text-gray-400">
            Upload a PDF on the left, then ask a question to get started.
          </p>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <UserMessage key={i} text={m.text} />
          ) : (
            <AssistantMessage key={i} intro={m.intro} items={m.items} />
          )
        )}

        {loading && (
          <div className="flex items-center gap-2 px-6 py-3 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Reading the PDF…
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t border-gray-200/70 bg-panel px-6 py-5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          type="text"
          placeholder="Hey! Ask me anything about your PDF."
          className="flex-1 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <ArrowRight size={18} />
        </button>
      </form>
    </section>
  );
}
