"use client";

import { useState } from "react";
import { Button, Card, ErrorNote, FileDrop, Progress, ResultFile, SelectedFile } from "./ui";
import { useObjectUrl } from "./hooks";
import { downloadBlob, withExtension } from "@/lib/files";

const DOCX = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function WordToPdf() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const previewUrl = useObjectUrl(result?.blob);

  const pickFile = ([next]) => {
    setResult(null);
    setError(null);
    if (!next.name.toLowerCase().endsWith(".docx")) {
      setError("Please choose a .docx file. Older .doc files need to be re-saved as .docx in Word first.");
      return;
    }
    setFile(next);
  };

  const convert = async () => {
    setError(null);
    setBusy(true);
    try {
      const { docxToPdf } = await import("@/lib/docxToPdf");
      const blob = await docxToPdf(file);
      setResult({ blob, name: withExtension(file.name, "pdf") });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <FileDrop
        accept={DOCX}
        onFiles={pickFile}
        title="Drop a Word document here"
        hint=".docx files from Word, Google Docs or LibreOffice"
        buttonLabel="Choose document"
        error={error}
      />
    );
  }

  return (
    <>
      <SelectedFile
        file={file}
        onClear={() => {
          setFile(null);
          setResult(null);
        }}
      />

      <Card>
        <p className="text-sm text-gray-500">
          Keeps text, headings, bold and italics, lists, tables and pictures. Exact fonts, columns, headers and
          footers are simplified.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <Button onClick={convert} disabled={busy}>
            Convert to PDF
          </Button>
          {busy && <Progress>Converting…</Progress>}
        </div>
        {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
      </Card>

      {result && (
        <>
          <ResultFile name={result.name} blob={result.blob} onDownload={() => downloadBlob(result.blob, result.name)} />
          {previewUrl && (
            <iframe
              src={previewUrl}
              title="PDF preview"
              className="h-[70vh] w-full rounded-2xl border border-gray-200 bg-white"
            />
          )}
        </>
      )}
    </>
  );
}
