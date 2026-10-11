"use client";

import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import PdfViewer from "../components/PdfViewer";
import ChatPanel from "../components/ChatPanel";
import { usePdf } from "../components/PdfContext";

export default function Home() {
  const { file } = usePdf();
  // Small screens show one panel at a time; large screens show both side by side.
  const [tab, setTab] = useState("document");

  // Jump to the chat once a PDF is in, and back to the upload screen after a reset.
  useEffect(() => {
    setTab(file ? "chat" : "document");
  }, [file]);

  const tabClass = (name) =>
    `flex-1 py-2.5 text-sm font-medium border-b-2 ${
      tab === name ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500"
    }`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <TopBar />

      {file && (
        <div className="flex border-b border-gray-100 lg:hidden">
          <button type="button" className={tabClass("document")} onClick={() => setTab("document")}>
            Document
          </button>
          <button type="button" className={tabClass("chat")} onClick={() => setTab("chat")}>
            Chat
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <PdfViewer className={tab === "document" ? "flex" : "hidden lg:flex"} />
        <ChatPanel
          className={`w-full shrink-0 border-gray-100 lg:w-[420px] lg:border-l ${
            tab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        />
      </div>
    </div>
  );
}
