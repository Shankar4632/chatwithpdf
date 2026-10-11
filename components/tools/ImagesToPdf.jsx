"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";
import { Button, Card, ErrorNote, Field, FileDrop, IconButton, Progress, ResultFile, Segmented } from "./ui";
import { canvasToBlob, drawImage, loadImage } from "@/lib/images";
import { downloadBlob } from "@/lib/files";
import { moveItem } from "@/lib/list";

const PAGE_SIZES = {
  fit: null,
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const MARGINS = { none: 0, small: 20, large: 40 };

let nextId = 0;

async function embedImage(pdf, file) {
  const bytes = await file.arrayBuffer();
  if (file.type === "image/jpeg") return pdf.embedJpg(bytes);
  if (file.type === "image/png") return pdf.embedPng(bytes);
  // PDFs can only hold JPG and PNG, so convert anything else first.
  const img = await loadImage(file);
  const blob = await canvasToBlob(drawImage(img, img.naturalWidth, img.naturalHeight, "image/jpeg"), "image/jpeg", 0.92);
  return pdf.embedJpg(await blob.arrayBuffer());
}

export default function ImagesToPdf() {
  const [items, setItems] = useState([]);
  const [pageSize, setPageSize] = useState("a4");
  const [margin, setMargin] = useState("small");
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.thumb)), []);
  useEffect(() => setResult(null), [items, pageSize, margin]);

  const addFiles = (files) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [...prev, ...images.map((file) => ({ id: nextId++, file, thumb: URL.createObjectURL(file) }))]);
  };

  const remove = (id) =>
    setItems((prev) => {
      const gone = prev.find((item) => item.id === id);
      if (gone) URL.revokeObjectURL(gone.thumb);
      return prev.filter((item) => item.id !== id);
    });

  const build = async () => {
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const pad = MARGINS[margin];
      for (const [i, { file }] of items.entries()) {
        setProgress(`Adding image ${i + 1} of ${items.length}…`);
        const image = await embedImage(pdf, file);
        // "Fit" pages match the image, treating pixels as 96 dpi.
        const natural = [image.width * 0.75, image.height * 0.75];
        let [pw, ph] = PAGE_SIZES[pageSize] ?? [natural[0] + pad * 2, natural[1] + pad * 2];
        if (PAGE_SIZES[pageSize] && image.width > image.height) [pw, ph] = [ph, pw]; // landscape photos get landscape pages
        const scale = Math.min((pw - pad * 2) / natural[0], (ph - pad * 2) / natural[1], PAGE_SIZES[pageSize] ? Infinity : 1);
        const w = natural[0] * scale;
        const h = natural[1] * scale;
        pdf.addPage([pw, ph]).drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
      const blob = new Blob([await pdf.save()], { type: "application/pdf" });
      setResult({ blob, name: items.length === 1 ? items[0].file.name.replace(/\.[^.]+$/, ".pdf") : "images.pdf" });
    } catch (err) {
      setError(err.message || "Couldn't create the PDF.");
    } finally {
      setProgress(null);
    }
  };

  if (items.length === 0) {
    return (
      <FileDrop
        accept="image/*"
        multiple
        onFiles={addFiles}
        title="Drop images here"
        hint="Each image becomes one page. You can reorder them next."
        buttonLabel="Choose images"
      />
    );
  }

  return (
    <>
      <Card className="p-0">
        <p className="border-b border-gray-100 px-4 py-3 text-sm text-gray-500">
          Drag to reorder, or use the arrows. Page order follows this list.
        </p>
        <ol>
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) setItems((prev) => moveItem(prev, dragIndex, index));
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0 ${
                dragIndex === index ? "opacity-40" : ""
              }`}
            >
              <GripVertical size={16} className="hidden shrink-0 cursor-grab text-gray-300 sm:block" />
              <span className="w-6 text-sm tabular-nums text-gray-400">{index + 1}</span>
              <img src={item.thumb} alt="" className="h-12 w-12 shrink-0 rounded-md bg-gray-50 object-cover ring-1 ring-gray-100" />
              <p className="min-w-0 flex-1 truncate text-sm text-gray-800">{item.file.name}</p>
              <IconButton label="Move up" disabled={index === 0} onClick={() => setItems((p) => moveItem(p, index, index - 1))}>
                <ArrowUp size={16} />
              </IconButton>
              <IconButton label="Move down" disabled={index === items.length - 1} onClick={() => setItems((p) => moveItem(p, index, index + 1))}>
                <ArrowDown size={16} />
              </IconButton>
              <IconButton label={`Remove ${item.file.name}`} onClick={() => remove(item.id)}>
                <X size={16} />
              </IconButton>
            </li>
          ))}
        </ol>
      </Card>

      <FileDrop accept="image/*" multiple compact onFiles={addFiles} title="Add more images" buttonLabel="Choose images" />

      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Page size">
            <Segmented
              label="Page size"
              value={pageSize}
              onChange={setPageSize}
              options={[
                { value: "a4", label: "A4" },
                { value: "letter", label: "Letter" },
                { value: "fit", label: "Same as image" },
              ]}
            />
          </Field>
          <Field label="Margin">
            <Segmented
              label="Margin"
              value={margin}
              onChange={setMargin}
              options={[
                { value: "none", label: "None" },
                { value: "small", label: "Small" },
                { value: "large", label: "Large" },
              ]}
            />
          </Field>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <Button onClick={build} disabled={Boolean(progress)}>
            Create PDF
          </Button>
          {progress && <Progress>{progress}</Progress>}
        </div>
        {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
      </Card>

      {result && <ResultFile name={result.name} blob={result.blob} onDownload={() => downloadBlob(result.blob, result.name)} />}
    </>
  );
}
