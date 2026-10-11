"use client";

import { useEffect, useState } from "react";
import { Link2, Link2Off } from "lucide-react";
import { Button, Card, ErrorNote, Field, FileDrop, Progress, QualitySlider, ResultFile, Select, SelectedFile, inputClass } from "./ui";
import { useEncodableFormats, useObjectUrl } from "./hooks";
import { formatForMime, loadImage, reencodeImage } from "@/lib/images";
import { baseName, downloadBlob } from "@/lib/files";

// Browsers refuse to draw canvases much larger than this.
const MAX_SIDE = 16384;
const PERCENTS = [25, 50, 75];

export default function ResizeImage() {
  const formats = useEncodableFormats();
  const [file, setFile] = useState(null);
  const [original, setOriginal] = useState(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState("same");
  const [quality, setQuality] = useState(0.9);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const previewUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob);

  // Any change to the settings makes the last result stale.
  useEffect(() => setResult(null), [width, height, format, quality]);

  const pickFile = async ([next]) => {
    setError(null);
    try {
      const img = await loadImage(next);
      setFile(next);
      setOriginal({ width: img.naturalWidth, height: img.naturalHeight });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
      setFormat("same");
    } catch (err) {
      setError(err.message);
    }
  };

  const changeWidth = (value) => {
    setWidth(value);
    if (lockRatio && Number(value) > 0) {
      setHeight(String(Math.max(1, Math.round((Number(value) * original.height) / original.width))));
    }
  };

  const changeHeight = (value) => {
    setHeight(value);
    if (lockRatio && Number(value) > 0) {
      setWidth(String(Math.max(1, Math.round((Number(value) * original.width) / original.height))));
    }
  };

  const applyPercent = (percent) => {
    setWidth(String(Math.max(1, Math.round((original.width * percent) / 100))));
    setHeight(String(Math.max(1, Math.round((original.height * percent) / 100))));
  };

  const sameFormat = formats.find((f) => f.mime === file?.type);
  const outFormat = format === "same" ? (sameFormat ?? formatForMime("image/png")) : formatForMime(format);

  const resize = async () => {
    const w = Number(width);
    const h = Number(height);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > MAX_SIDE || h > MAX_SIDE) {
      setError(`Width and height must be whole numbers between 1 and ${MAX_SIDE}.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const blob = await reencodeImage(file, { mime: outFormat.mime, quality, width: w, height: h });
      setResult({ blob, name: `${baseName(file.name)}-${w}x${h}.${outFormat.ext}` });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <FileDrop
        accept="image/*"
        onFiles={pickFile}
        title="Drop an image here"
        hint="JPG, PNG, WEBP, GIF, BMP or AVIF"
        buttonLabel="Choose image"
        error={error}
      />
    );
  }

  const LockIcon = lockRatio ? Link2 : Link2Off;

  return (
    <>
      <SelectedFile
        file={file}
        detail={`${original.width} × ${original.height} px`}
        onClear={() => {
          setFile(null);
          setResult(null);
        }}
      />

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Original"
              className="h-40 w-full rounded-lg bg-gray-50 object-contain ring-1 ring-gray-100 sm:w-40"
            />
          )}

          <div className="flex-1 space-y-4">
            <div className="flex items-end gap-2">
              <Field label="Width (px)" htmlFor="width">
                <input id="width" type="number" min={1} max={MAX_SIDE} value={width} onChange={(e) => changeWidth(e.target.value)} className={inputClass} />
              </Field>
              <button
                type="button"
                onClick={() => setLockRatio((v) => !v)}
                aria-pressed={lockRatio}
                title={lockRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                className={`mb-0.5 rounded-lg p-2 ${lockRatio ? "text-indigo-600 hover:bg-indigo-50" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <LockIcon size={18} />
              </button>
              <Field label="Height (px)" htmlFor="height">
                <input id="height" type="number" min={1} max={MAX_SIDE} value={height} onChange={(e) => changeHeight(e.target.value)} className={inputClass} />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              {PERCENTS.map((p) => (
                <Button key={p} variant="secondary" className="px-3 py-1.5" onClick={() => applyPercent(p)}>
                  {p}%
                </Button>
              ))}
              <Button variant="secondary" className="px-3 py-1.5" onClick={() => applyPercent(100)}>
                Original
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Save as" htmlFor="format">
                <Select
                  id="format"
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: "same", label: `Same as original (${sameFormat?.label ?? "PNG"})` },
                    ...formats.map((f) => ({ value: f.mime, label: f.label })),
                  ]}
                />
              </Field>
              {outFormat.lossy && <QualitySlider value={quality} onChange={setQuality} />}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <Button onClick={resize} disabled={busy}>
            Resize image
          </Button>
          {busy && <Progress>Resizing…</Progress>}
        </div>
        {error && <ErrorNote className="mt-3">{error}</ErrorNote>}
      </Card>

      {result && (
        <Card>
          {resultUrl && (
            <img src={resultUrl} alt="Resized" className="mx-auto mb-4 max-h-80 rounded-lg object-contain ring-1 ring-gray-100" />
          )}
          <ResultFile name={result.name} blob={result.blob} onDownload={() => downloadBlob(result.blob, result.name)} />
        </Card>
      )}
    </>
  );
}
