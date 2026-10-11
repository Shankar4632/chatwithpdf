"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import { Button, Card, FileDrop } from "./ui";
import { downloadBlob, formatBytes, zipFiles } from "@/lib/files";

let nextId = 0;

/**
 * A list of images processed one after another with the same settings.
 * `process(file)` returns { blob, name, note? }. Changing `settingsKey` clears old results.
 */
export default function ImageBatch({ settings, process, settingsKey, actionLabel, zipName }) {
  const [items, setItems] = useState([]);
  const [running, setRunning] = useState(false);
  const [zipping, setZipping] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Free the thumbnail URLs when leaving the page.
  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.thumb)), []);

  useEffect(() => {
    setItems((prev) => prev.map((item) => ({ ...item, status: "ready", result: null, error: null })));
  }, [settingsKey]);

  const addFiles = (files) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [
      ...prev,
      ...images.map((file) => ({
        id: nextId++,
        file,
        thumb: URL.createObjectURL(file),
        status: "ready",
        result: null,
        error: null,
      })),
    ]);
  };

  const remove = (id) => {
    setItems((prev) => {
      const gone = prev.find((item) => item.id === id);
      if (gone) URL.revokeObjectURL(gone.thumb);
      return prev.filter((item) => item.id !== id);
    });
  };

  const update = (id, patch) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const runAll = async () => {
    setRunning(true);
    for (const item of itemsRef.current) {
      if (item.status === "done") continue;
      update(item.id, { status: "working", error: null });
      try {
        update(item.id, { status: "done", result: await process(item.file) });
      } catch (err) {
        update(item.id, { status: "error", error: err.message });
      }
    }
    setRunning(false);
  };

  const done = items.filter((item) => item.status === "done");

  const downloadAll = async () => {
    setZipping(true);
    try {
      downloadBlob(await zipFiles(done.map((item) => item.result)), zipName);
    } finally {
      setZipping(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Card>{settings}</Card>
        <FileDrop
          accept="image/*"
          multiple
          onFiles={addFiles}
          title="Drop images here"
          hint="Add as many as you like: JPG, PNG, WEBP, GIF, BMP or AVIF"
          buttonLabel="Choose images"
        />
      </>
    );
  }

  return (
    <>
      <Card>{settings}</Card>

      <Card className="p-0">
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <img src={item.thumb} alt="" className="h-12 w-12 shrink-0 rounded-md bg-gray-50 object-cover ring-1 ring-gray-100" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{item.result?.name ?? item.file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatBytes(item.file.size)}
                  {item.result && (
                    <>
                      {" → "}
                      {formatBytes(item.result.blob.size)}
                      <SizeChange before={item.file.size} after={item.result.blob.size} />
                    </>
                  )}
                </p>
                {item.result?.note && <p className="text-xs text-gray-500">{item.result.note}</p>}
                {item.error && <p className="text-xs text-red-600">{item.error}</p>}
              </div>

              {item.status === "working" && <Loader2 size={18} className="animate-spin text-indigo-600" />}
              {item.status === "done" && (
                <>
                  <CheckCircle2 size={18} className="hidden text-green-600 sm:block" />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5"
                    onClick={() => downloadBlob(item.result.blob, item.result.name)}
                  >
                    <Download size={15} />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </>
              )}
              <button
                type="button"
                aria-label={`Remove ${item.file.name}`}
                onClick={() => remove(item.id)}
                disabled={running}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runAll} disabled={running || done.length === items.length}>
          {running && <Loader2 size={16} className="animate-spin" />}
          {actionLabel} {items.length > 1 ? `(${items.length})` : ""}
        </Button>
        {done.length > 1 && (
          <Button variant="secondary" onClick={downloadAll} disabled={zipping || running}>
            <Download size={16} />
            {zipping ? "Zipping…" : "Download all (.zip)"}
          </Button>
        )}
      </div>

      <FileDrop accept="image/*" multiple compact onFiles={addFiles} title="Add more images" buttonLabel="Choose images" />
    </>
  );
}

function SizeChange({ before, after }) {
  const percent = Math.round((1 - after / before) * 100);
  if (percent > 0) return <span className="font-medium text-green-700"> ({percent}% smaller)</span>;
  if (percent < 0) return <span> ({-percent}% larger)</span>;
  return null;
}
