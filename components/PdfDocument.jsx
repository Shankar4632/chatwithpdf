"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { Loader2 } from "lucide-react";
import { PDFJS_OPTIONS } from "@/lib/pdfOptions";

// Must be set in the same module that renders <Document> (see react-pdf docs).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function Status({ children }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
      {children}
    </div>
  );
}

export default function PdfDocument({ file, width, numPages, onLoad, onError }) {
  return (
    <Document
      file={file}
      options={PDFJS_OPTIONS}
      onLoadSuccess={({ numPages }) => onLoad(numPages)}
      onLoadError={onError}
      loading={
        <Status>
          <Loader2 size={16} className="animate-spin" />
          Opening PDF…
        </Status>
      }
      error={<Status>This PDF couldn&apos;t be displayed. You can still ask questions about it.</Status>}
      className="mx-auto flex w-fit flex-col gap-6"
    >
      {Array.from({ length: numPages }, (_, i) => (
        <div
          key={i}
          data-page={i + 1}
          className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-gray-200"
        >
          <Page
            pageNumber={i + 1}
            width={width}
            loading={<div style={{ width, height: width * 1.3 }} className="bg-white" />}
          />
        </div>
      ))}
    </Document>
  );
}
