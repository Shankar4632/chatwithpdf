"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, RotateCw, Trash2, Undo2 } from "lucide-react";
import { Button, Card, ErrorNote, FileDrop, IconButton, Progress, ResultFile, SelectedFile } from "./ui";
import { baseName, downloadBlob } from "@/lib/files";
import { moveItem } from "@/lib/list";

// Thumbnails are rendered small; an A4 page comes out about 180 px wide.
const THUMB_SCALE = 0.3;

function turn(rotation, by) {
  return (rotation + by + 360) % 360;
}

export default function OrganizePdf() {
  const [file, setFile] = useState(null);
  const [original, setOriginal] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => setResult(null), [pages]);

  const pickFile = async ([next]) => {
    setError(null);
    setFile(next);
    setOriginal([]);
    setPages([]);
    setLoading("Opening PDF…");
    try {
      const { openPdf, renderPageToCanvas } = await import("@/lib/pdf");
      const pdf = await openPdf(next);
      const loaded = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        setLoading(`Loading page ${n} of ${pdf.numPages}…`);
        const { canvas } = await renderPageToCanvas(pdf, n, THUMB_SCALE);
        loaded.push({ id: n, index: n - 1, rotation: 0, thumb: canvas.toDataURL("image/jpeg", 0.7) });
      }
      setOriginal(loaded);
      setPages(loaded);
    } catch (err) {
      setError(err.message);
      setFile(null);
    } finally {
      setLoading(null);
    }
  };

  const rotate = (id, by) => setPages((prev) => prev.map((p) => (p.id === id ? { ...p, rotation: turn(p.rotation, by) } : p)));
  const rotateAll = (by) => setPages((prev) => prev.map((p) => ({ ...p, rotation: turn(p.rotation, by) })));

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const [{ loadPdfLib }, { PDFDocument, degrees }] = await Promise.all([import("@/lib/pdf"), import("pdf-lib")]);
      const source = await loadPdfLib(file);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(source, pages.map((p) => p.index));
      copied.forEach((page, i) => {
        page.setRotation(degrees(turn(page.getRotation().angle, pages[i].rotation)));
        out.addPage(page);
      });
      const blob = new Blob([await out.save()], { type: "application/pdf" });
      setResult({ blob, name: `${baseName(file.name)}-organized.pdf` });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!file) {
    return (
      <FileDrop
        accept="application/pdf,.pdf"
        onFiles={pickFile}
        title="Drop a PDF here"
        hint="Rotate, reorder or remove pages"
        buttonLabel="Choose PDF"
        error={error}
      />
    );
  }

  return (
    <>
      <SelectedFile file={file} detail={pages.length ? `${pages.length} pages` : undefined} onClear={() => setFile(null)} />

      {loading && <Progress>{loading}</Progress>}

      {pages.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => rotateAll(-90)}>
              <RotateCcw size={16} />
              Rotate all left
            </Button>
            <Button variant="secondary" onClick={() => rotateAll(90)}>
              <RotateCw size={16} />
              Rotate all right
            </Button>
            <Button variant="secondary" onClick={() => setPages(original)}>
              <Undo2 size={16} />
              Reset
            </Button>
          </div>

          <p className="text-sm text-gray-500">Drag pages to reorder them, or use the arrows under each page.</p>

          <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {pages.map((page, index) => (
              <li
                key={page.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== index) setPages((prev) => moveItem(prev, dragIndex, index));
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`group relative cursor-grab rounded-xl border border-gray-200 bg-white p-2 shadow-sm active:cursor-grabbing ${
                  dragIndex === index ? "opacity-40" : ""
                }`}
              >
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                  <img
                    src={page.thumb}
                    alt={`Page ${page.index + 1}`}
                    draggable={false}
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                    className="max-h-full max-w-full shadow-sm ring-1 ring-gray-200 transition-transform"
                  />
                </div>
                <IconButton
                  label={`Delete page ${index + 1}`}
                  onClick={() => setPages((prev) => prev.filter((p) => p.id !== page.id))}
                  className="absolute right-3 top-3 rounded-md bg-white/90 p-1.5 text-gray-500 shadow-sm hover:text-red-600"
                >
                  <Trash2 size={15} />
                </IconButton>
                <div className="mt-2 flex items-center justify-between">
                  <IconButton label="Move earlier" disabled={index === 0} onClick={() => setPages((p) => moveItem(p, index, index - 1))}>
                    <ArrowLeft size={15} />
                  </IconButton>
                  <IconButton label="Rotate left" onClick={() => rotate(page.id, -90)}>
                    <RotateCcw size={15} />
                  </IconButton>
                  <span className="text-xs tabular-nums text-gray-500">{index + 1}</span>
                  <IconButton label="Rotate right" onClick={() => rotate(page.id, 90)}>
                    <RotateCw size={15} />
                  </IconButton>
                  <IconButton
                    label="Move later"
                    disabled={index === pages.length - 1}
                    onClick={() => setPages((p) => moveItem(p, index, index + 1))}
                  >
                    <ArrowRight size={15} />
                  </IconButton>
                </div>
              </li>
            ))}
          </ol>

          <Card>
            <div className="flex items-center gap-4">
              <Button onClick={save} disabled={saving}>
                Save PDF
              </Button>
              {saving && <Progress>Saving…</Progress>}
            </div>
            {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
          </Card>

          {result && <ResultFile name={result.name} blob={result.blob} onDownload={() => downloadBlob(result.blob, result.name)} />}
        </>
      )}

      {original.length > 0 && pages.length === 0 && !loading && (
        <Card>
          <p className="text-sm text-gray-500">You removed every page.</p>
          <Button variant="secondary" className="mt-3" onClick={() => setPages(original)}>
            <Undo2 size={16} />
            Bring them back
          </Button>
        </Card>
      )}
    </>
  );
}
