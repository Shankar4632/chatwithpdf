"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Maximize2,
  UploadCloud,
} from "lucide-react";
import { usePdf } from "./PdfContext";

export default function PdfViewer({ pageCount = 23 }) {
  const [page, setPage] = useState(1);
  const { fileName, pdfBase64, loadPdfFile } = usePdf();
  const inputRef = useRef(null);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount, p + 1));

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await loadPdfFile(file);
  };

  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-white">
      <div className="thin-scrollbar mx-6 mb-24 mt-2 flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white">
        <div className="mx-auto max-w-xl px-10 py-12">
          <h2 className="mb-8 text-lg font-bold underline decoration-2 underline-offset-4">
            {fileName || "No PDF uploaded yet"}
          </h2>

          {!pdfBase64 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mx-auto flex aspect-[3/4] w-56 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500"
            >
              <UploadCloud size={28} strokeWidth={1.5} />
              Click to upload a PDF
            </button>
          ) : (
            <div className="mx-auto mb-10 flex aspect-[3/4] w-56 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
              Page {page} preview
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-8 space-y-3">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-3/4 rounded bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Floating page / zoom control pill */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-900/90 px-2 py-1.5 text-white shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-30"
          disabled={page === 1}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm">
          <span className="font-medium">{page}</span>
          <span className="text-white/50">/{pageCount}</span>
        </div>

        <button
          type="button"
          onClick={goNext}
          className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-30"
          disabled={page === pageCount}
        >
          <ChevronRight size={16} />
        </button>

        <div className="mx-1 h-5 w-px bg-white/20" />

        <button type="button" className="rounded-full p-1.5 hover:bg-white/10">
          <Minus size={16} />
        </button>
        <button type="button" className="rounded-full p-1.5 hover:bg-white/10">
          <Plus size={16} />
        </button>
        <button type="button" className="rounded-full p-1.5 hover:bg-white/10">
          <Maximize2 size={16} />
        </button>
      </div>
    </section>
  );
}
