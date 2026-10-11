"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button, Card, ErrorNote, Field, FileDrop, Progress, QualitySlider, Segmented, SelectedFile } from "./ui";
import { canvasToBlob } from "@/lib/images";
import { baseName, downloadBlob, formatBytes, zipFiles } from "@/lib/files";

const FORMATS = [
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
];
// pdf.js renders at 72 dpi when scale is 1.
const RESOLUTIONS = [
  { value: "1", label: "72 dpi (screen)" },
  { value: "2", label: "144 dpi (sharp)" },
  { value: "4", label: "288 dpi (print)" },
];

export default function PdfToImages() {
  const [file, setFile] = useState(null);
  const [mime, setMime] = useState("image/png");
  const [scale, setScale] = useState("2");
  const [quality, setQuality] = useState(0.9);
  const [progress, setProgress] = useState(null);
  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);
  const [zipping, setZipping] = useState(false);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const clearPages = () =>
    setPages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });

  useEffect(() => () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);
  useEffect(clearPages, [file, mime, scale, quality]);

  const format = FORMATS.find((f) => f.value === mime);

  const convert = async () => {
    setError(null);
    clearPages();
    setProgress("Opening PDF…");
    try {
      const { openPdf, renderPageToCanvas } = await import("@/lib/pdf");
      const pdf = await openPdf(file);
      const pad = String(pdf.numPages).length;
      for (let n = 1; n <= pdf.numPages; n++) {
        setProgress(`Rendering page ${n} of ${pdf.numPages}…`);
        const { canvas } = await renderPageToCanvas(pdf, n, Number(scale));
        const blob = await canvasToBlob(canvas, mime, quality);
        const name = `${baseName(file.name)}-page-${String(n).padStart(pad, "0")}.${format.ext}`;
        setPages((prev) => [...prev, { n, blob, name, url: URL.createObjectURL(blob) }]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  const downloadAll = async () => {
    setZipping(true);
    try {
      downloadBlob(await zipFiles(pages), `${baseName(file.name)}-images.zip`);
    } finally {
      setZipping(false);
    }
  };

  if (!file) {
    return <FileDrop accept="application/pdf,.pdf" onFiles={([f]) => setFile(f)} title="Drop a PDF here" buttonLabel="Choose PDF" />;
  }

  return (
    <>
      <SelectedFile file={file} onClear={() => setFile(null)} />

      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Image format">
            <Segmented label="Image format" value={mime} onChange={setMime} options={FORMATS} />
          </Field>
          <Field label="Resolution">
            <Segmented label="Resolution" value={scale} onChange={setScale} options={RESOLUTIONS} />
          </Field>
          {mime === "image/jpeg" && <QualitySlider value={quality} onChange={setQuality} />}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button onClick={convert} disabled={Boolean(progress)}>
            Convert to images
          </Button>
          {pages.length > 1 && !progress && (
            <Button variant="secondary" onClick={downloadAll} disabled={zipping}>
              <Download size={16} />
              {zipping ? "Zipping…" : `Download all ${pages.length} (.zip)`}
            </Button>
          )}
          {progress && <Progress>{progress}</Progress>}
        </div>
        {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
      </Card>

      {pages.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {pages.map((page) => (
            <li key={page.n} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img src={page.url} alt={`Page ${page.n}`} className="aspect-[3/4] w-full bg-gray-50 object-contain" />
              <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
                <span className="text-xs text-gray-500">
                  Page {page.n} · {formatBytes(page.blob.size)}
                </span>
                <button
                  type="button"
                  aria-label={`Download page ${page.n}`}
                  onClick={() => downloadBlob(page.blob, page.name)}
                  className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                >
                  <Download size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
