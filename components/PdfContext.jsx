"use client";

import { createContext, useContext, useState } from "react";

const PdfContext = createContext(null);

export function PdfProvider({ children }) {
  const [pdfBase64, setPdfBase64] = useState(null);
  const [fileName, setFileName] = useState(null);

  const loadPdfFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // reader.result looks like "data:application/pdf;base64,XXXX"
        const base64 = reader.result.split(",")[1];
        setPdfBase64(base64);
        setFileName(file.name);
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <PdfContext.Provider value={{ pdfBase64, fileName, loadPdfFile }}>
      {children}
    </PdfContext.Provider>
  );
}

export function usePdf() {
  const ctx = useContext(PdfContext);
  if (!ctx) throw new Error("usePdf must be used inside a PdfProvider");
  return ctx;
}
