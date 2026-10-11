"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorNote, Field, FileDrop, Progress, ResultFile, Segmented, SelectedFile } from "./ui";
import { downloadBlob, withExtension } from "@/lib/files";

const MODES = [
  { value: "text", label: "Editable text" },
  { value: "image", label: "Exact look" },
];

export default function PdfToWord() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("text");
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => setResult(null), [file, mode]);

  const convert = async () => {
    setError(null);
    setProgress("Starting…");
    try {
      const { pdfToEditableDocx, pdfToImageDocx } = await import("@/lib/pdfToDocx");
      const run = mode === "text" ? pdfToEditableDocx : pdfToImageDocx;
      const blob = await run(file, (n, total) => setProgress(`Reading page ${n} of ${total}…`));
      setResult({ blob, name: withExtension(file.name, "docx") });
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  if (!file) {
    return (
      <FileDrop
        accept="application/pdf,.pdf"
        onFiles={([f]) => setFile(f)}
        title="Drop a PDF here"
        buttonLabel="Choose PDF"
      />
    );
  }

  return (
    <>
      <SelectedFile file={file} onClear={() => setFile(null)} />

      <Card>
        <Field label="Conversion mode">
          <Segmented label="Conversion mode" value={mode} onChange={setMode} options={MODES} />
        </Field>
        <p className="mt-3 text-sm text-gray-500">
          {mode === "text"
            ? "Gives you text you can edit, with paragraphs, headings and bullet points. Complex layouts like columns, tables and images aren't kept."
            : "Every page looks exactly like the PDF, but as a picture, so the text can't be edited. Use this for scanned PDFs."}
        </p>

        <div className="mt-5 flex items-center gap-4">
          <Button onClick={convert} disabled={Boolean(progress)}>
            Convert to Word
          </Button>
          {progress && <Progress>{progress}</Progress>}
        </div>
        {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
      </Card>

      {result && <ResultFile name={result.name} blob={result.blob} onDownload={() => downloadBlob(result.blob, result.name)} />}
    </>
  );
}
