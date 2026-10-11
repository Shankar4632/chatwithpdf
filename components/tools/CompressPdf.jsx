"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorNote, Field, FileDrop, Progress, QualitySlider, ResultFile, Segmented, SelectedFile } from "./ui";
import { canvasToBlob } from "@/lib/images";
import { baseName, downloadBlob } from "@/lib/files";

const MODES = [
  { value: "basic", label: "Basic" },
  { value: "strong", label: "Strong" },
];
// Render scale relative to 72 dpi.
const RESOLUTIONS = [
  { value: "1", label: "72 dpi (smallest)" },
  { value: "1.5", label: "108 dpi" },
  { value: "2", label: "144 dpi (clearer)" },
];

async function basicCompress(file) {
  const { loadPdfLib } = await import("@/lib/pdf");
  const pdf = await loadPdfLib(file);
  // Rewriting with object streams packs the file's internal structure more tightly.
  return new Blob([await pdf.save({ useObjectStreams: true })], { type: "application/pdf" });
}

async function strongCompress(file, { scale, quality }, onProgress) {
  const [{ openPdf, renderPageToCanvas }, { PDFDocument }] = await Promise.all([import("@/lib/pdf"), import("pdf-lib")]);
  const source = await openPdf(file);
  const out = await PDFDocument.create();
  for (let n = 1; n <= source.numPages; n++) {
    onProgress(n, source.numPages);
    const { canvas, width, height } = await renderPageToCanvas(source, n, scale);
    const jpg = await (await canvasToBlob(canvas, "image/jpeg", quality)).arrayBuffer();
    const image = await out.embedJpg(jpg);
    out.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
  }
  return new Blob([await out.save()], { type: "application/pdf" });
}

export default function CompressPdf() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("basic");
  const [scale, setScale] = useState("1.5");
  const [quality, setQuality] = useState(0.6);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => setResult(null), [file, mode, scale, quality]);

  const compress = async () => {
    setError(null);
    setProgress("Compressing…");
    try {
      const blob =
        mode === "basic"
          ? await basicCompress(file)
          : await strongCompress(file, { scale: Number(scale), quality }, (n, total) =>
              setProgress(`Compressing page ${n} of ${total}…`),
            );
      setResult({ blob, name: `${baseName(file.name)}-compressed.pdf` });
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  if (!file) {
    return <FileDrop accept="application/pdf,.pdf" onFiles={([f]) => setFile(f)} title="Drop a PDF here" buttonLabel="Choose PDF" />;
  }

  const smaller = result && result.blob.size < file.size;

  return (
    <>
      <SelectedFile file={file} onClear={() => setFile(null)} />

      <Card>
        <Field label="Compression">
          <Segmented label="Compression" value={mode} onChange={setMode} options={MODES} />
        </Field>
        <p className="mt-3 text-sm text-gray-500">
          {mode === "basic"
            ? "Tidies up the file without changing how it looks. Text stays selectable. Savings are usually small."
            : "Turns every page into a compressed picture. Much smaller for scanned or image-heavy PDFs, but text is no longer selectable or searchable."}
        </p>

        {mode === "strong" && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Resolution">
              <Segmented label="Resolution" value={scale} onChange={setScale} options={RESOLUTIONS} />
            </Field>
            <QualitySlider value={quality} onChange={setQuality} />
          </div>
        )}

        <div className="mt-5 flex items-center gap-4">
          <Button onClick={compress} disabled={Boolean(progress)}>
            Compress PDF
          </Button>
          {progress && <Progress>{progress}</Progress>}
        </div>
        {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
      </Card>

      {result && (
        <ResultFile
          name={smaller ? result.name : file.name}
          blob={smaller ? result.blob : file}
          originalSize={file.size}
          onDownload={() => (smaller ? downloadBlob(result.blob, result.name) : downloadBlob(file, file.name))}
        >
          {!smaller && (
            <p className="mt-1 text-xs text-gray-600">
              This PDF is already well compressed{mode === "basic" ? ". Try Strong mode for a smaller file." : ", so you can keep the original."}
            </p>
          )}
        </ResultFile>
      )}
    </>
  );
}
