"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react";
import { usePdf } from "./PdfContext";
import { FileDrop } from "./tools/ui";

// pdf.js only runs in the browser, so keep it out of the server render.
const PdfDocument = dynamic(() => import("./PdfDocument"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
      <Loader2 size={16} className="animate-spin" />
      Loading viewer…
    </div>
  ),
});

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

function Dropzone() {
  const { loadPdfFile, uploadError } = usePdf();
  const [reading, setReading] = useState(false);

  const handleFiles = async ([file]) => {
    setReading(true);
    await loadPdfFile(file);
    setReading(false);
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <FileDrop
          accept="application/pdf,.pdf"
          onFiles={handleFiles}
          title="Drop a PDF here"
          hint="or choose one from your computer (up to 20 MB)"
          buttonLabel="Choose PDF"
          busy={reading}
          error={uploadError}
        />
      </div>
    </div>
  );
}

function PillButton({ label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="rounded-full p-1.5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-30 disabled:hover:bg-transparent"
      {...props}
    />
  );
}

export default function PdfViewer({ className = "" }) {
  const { file } = usePdf();
  const sectionRef = useRef(null);
  const scrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  // A new file starts back at page 1 and 100%.
  useEffect(() => {
    setNumPages(0);
    setPage(1);
    setZoom(1);
  }, [file]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [file]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === sectionRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!file) {
    return (
      <section className={`min-w-0 flex-1 bg-white ${className}`}>
        <Dropzone />
      </section>
    );
  }

  const pageWidth = Math.max(200, Math.min(containerWidth, 860) * zoom);

  const goToPage = (n) => {
    const target = Math.min(Math.max(1, n), numPages);
    scrollRef.current
      ?.querySelector(`[data-page="${target}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPage(target);
  };

  // The current page is the last one whose top has scrolled past the middle of the view.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const middle = el.getBoundingClientRect().top + el.clientHeight / 2;
    let current = 1;
    el.querySelectorAll("[data-page]").forEach((node) => {
      if (node.getBoundingClientRect().top <= middle) current = Number(node.dataset.page);
    });
    setPage(current);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else sectionRef.current?.requestFullscreen?.();
  };

  return (
    <section ref={sectionRef} className={`relative min-w-0 flex-1 flex-col bg-gray-100 ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="thin-scrollbar flex-1 overflow-auto px-3 pb-24 pt-4 sm:px-6 sm:pt-6"
      >
        {containerWidth > 0 && (
          <PdfDocument
            file={file}
            width={pageWidth}
            numPages={numPages}
            onLoad={setNumPages}
            onError={(err) => console.error("PDF render error:", err)}
          />
        )}
      </div>

      {numPages > 0 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-900/90 px-2 py-1.5 text-white shadow-lg backdrop-blur">
          <PillButton label="Previous page" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft size={16} />
          </PillButton>

          <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums">
            <span className="font-medium">{page}</span>
            <span className="text-white/50">/ {numPages}</span>
          </div>

          <PillButton label="Next page" onClick={() => goToPage(page + 1)} disabled={page >= numPages}>
            <ChevronRight size={16} />
          </PillButton>

          <div className="mx-1 h-5 w-px bg-white/20" />

          <PillButton
            label="Zoom out"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
          >
            <Minus size={16} />
          </PillButton>
          <button
            type="button"
            onClick={() => setZoom(1)}
            title="Reset zoom"
            className="w-12 rounded-full py-1 text-center text-xs tabular-nums hover:bg-white/10"
          >
            {Math.round(zoom * 100)}%
          </button>
          <PillButton
            label="Zoom in"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
          >
            <Plus size={16} />
          </PillButton>
          <PillButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </PillButton>
        </div>
      )}
    </section>
  );
}
