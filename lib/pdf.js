// Browser-only PDF helpers. Import this with `await import("@/lib/pdf")`, never at the
// top of a module, because pdf.js can't load during server rendering.
import { pdfjs } from "react-pdf";
import { PDFJS_OPTIONS } from "./pdfOptions";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/** Opens a PDF File with pdf.js for reading text or rendering pages. */
export async function openPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  try {
    return await pdfjs.getDocument({ data, ...PDFJS_OPTIONS }).promise;
  } catch (err) {
    throw new Error(pdfErrorMessage(err));
  }
}

export async function renderPageToCanvas(pdf, pageNumber, scale) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  // Pages without a background would otherwise come out transparent (black in JPG).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  // Size in PDF points (1/72 inch), for building documents with the same page size.
  const { width, height } = page.getViewport({ scale: 1 });
  page.cleanup();
  return { canvas, width, height };
}

export function pdfErrorMessage(err) {
  const name = err?.name ?? "";
  const message = String(err?.message ?? "");
  if (name === "PasswordException" || /encrypt|password/i.test(message)) {
    return "This PDF is password-protected. Remove the password and try again.";
  }
  if (name === "InvalidPDFException" || /invalid pdf/i.test(message)) {
    return "This file isn't a valid PDF, or it's damaged.";
  }
  return message || "Something went wrong reading this PDF.";
}

/** Loads a PDF with pdf-lib for editing, with a readable error for locked files. */
export async function loadPdfLib(file) {
  const { PDFDocument } = await import("pdf-lib");
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch (err) {
    throw new Error(pdfErrorMessage(err));
  }
}
