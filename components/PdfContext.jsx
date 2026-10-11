"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Gemini accepts inline PDFs up to roughly this size per request.
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

const PdfContext = createContext(null);

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // reader.result looks like "data:application/pdf;base64,XXXX"
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PdfProvider({ children }) {
  const [file, setFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [messages, setMessages] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  const loadPdfFile = useCallback(async (nextFile) => {
    setUploadError(null);

    const isPdf =
      nextFile.type === "application/pdf" ||
      nextFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("That file isn't a PDF. Please choose a .pdf file.");
      return;
    }
    if (nextFile.size > MAX_PDF_BYTES) {
      setUploadError("That PDF is larger than 20 MB. Please choose a smaller file.");
      return;
    }

    try {
      const base64 = await readAsBase64(nextFile);
      setFile(nextFile);
      setPdfBase64(base64);
      setMessages([]);
    } catch {
      setUploadError("Couldn't read that file. Please try again.");
    }
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setPdfBase64(null);
    setMessages([]);
    setUploadError(null);
  }, []);

  return (
    <PdfContext.Provider
      value={{
        file,
        fileName: file?.name ?? null,
        pdfBase64,
        messages,
        setMessages,
        uploadError,
        loadPdfFile,
        reset,
      }}
    >
      {children}
    </PdfContext.Provider>
  );
}

export function usePdf() {
  const ctx = useContext(PdfContext);
  if (!ctx) throw new Error("usePdf must be used inside a PdfProvider");
  return ctx;
}
