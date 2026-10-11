"use client";

import { Download, FileText, RotateCcw } from "lucide-react";
import { usePdf } from "./PdfContext";

function exportChat(fileName, messages) {
  const lines = [`# Chat about ${fileName}`, ""];
  for (const m of messages) {
    lines.push(m.role === "user" ? `**You:** ${m.text}` : `**Assistant:** ${m.text}`, "");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/\.pdf$/i, "")} - chat.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TopBar() {
  const { fileName, messages, reset } = usePdf();

  const handleStartOver = () => {
    if (messages.length > 0 && !window.confirm("Start over? This clears the PDF and the conversation.")) return;
    reset();
  };

  return (
    <header className="flex items-center gap-4 border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
      <h1 className="shrink-0 text-lg font-bold text-gray-900 sm:text-xl">Chat with PDF</h1>

      {fileName && (
        <span className="hidden min-w-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 md:flex">
          <FileText size={14} className="shrink-0" />
          <span className="truncate">{fileName}</span>
        </span>
      )}

      {fileName && (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleStartOver}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Start over</span>
          </button>
          <button
            type="button"
            onClick={() => exportChat(fileName, messages)}
            disabled={messages.length === 0}
            title={messages.length === 0 ? "Ask a question first" : "Download the conversation as Markdown"}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export chat</span>
          </button>
        </div>
      )}
    </header>
  );
}
