"use client";

import { useRef, useState } from "react";
import { AlertCircle, Download, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { findTool } from "@/lib/site";
import { formatBytes } from "@/lib/files";

export function ToolPage({ href, description, children }) {
  const { label, icon: Icon } = findTool(href);
  return (
    <div className="thin-scrollbar flex-1 overflow-y-auto bg-gray-50/60">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Icon size={22} strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className="space-y-5">{children}</div>
        <p className="mt-8 flex items-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck size={14} />
          Processed in your browser. Your files are never uploaded.
        </p>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function FileDrop({
  accept,
  multiple = false,
  onFiles,
  title = "Drop a file here",
  hint,
  buttonLabel = "Choose file",
  busy = false,
  error,
  compact = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handle = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed text-center transition-colors ${
        compact ? "px-6 py-6" : "px-8 py-14"
      } ${dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"}`}
    >
      {!compact && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          {busy ? <Loader2 size={26} className="animate-spin" /> : <UploadCloud size={26} strokeWidth={1.75} />}
        </span>
      )}
      <p className={`font-semibold text-gray-900 ${compact ? "text-sm" : "text-base"}`}>{title}</p>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}

      <Button className={compact ? "mt-3" : "mt-6"} onClick={() => inputRef.current?.click()} disabled={busy}>
        {buttonLabel}
      </Button>

      {error && <ErrorNote className="mt-4">{error}</ErrorNote>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          handle(e.target.files);
          // Reset so picking the same file again still fires onChange.
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}

export function Button({ variant = "primary", className = "", children, ...props }) {
  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:text-gray-300";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, htmlFor, children, hint }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400";

export function Select({ value, onChange, options, ...props }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** A row of mutually exclusive choices, for options with only two to four values. */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            value === o.value ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function QualitySlider({ value, onChange, id = "quality" }) {
  return (
    <Field label={`Quality: ${Math.round(value * 100)}%`} htmlFor={id} hint="Lower quality gives smaller files.">
      <input
        id={id}
        type="range"
        min={0.1}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </Field>
  );
}

export function ErrorNote({ children, className = "" }) {
  return (
    <p role="alert" className={`flex items-start gap-2 text-sm text-red-600 ${className}`}>
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Progress({ children }) {
  return (
    <p className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite">
      <Loader2 size={16} className="animate-spin" />
      {children}
    </p>
  );
}

/** A finished file: name, size (with the before size, if given) and a download button. */
export function ResultFile({ name, blob, originalSize, onDownload, children }) {
  const saved = originalSize ? Math.round((1 - blob.size / originalSize) * 100) : null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-600">
          {originalSize ? `${formatBytes(originalSize)} → ` : ""}
          {formatBytes(blob.size)}
          {saved !== null && saved > 0 && <span className="font-medium text-green-700"> ({saved}% smaller)</span>}
          {saved !== null && saved <= 0 && <span className="text-gray-500"> (no smaller)</span>}
        </p>
        {children}
      </div>
      <Button onClick={onDownload}>
        <Download size={16} />
        Download
      </Button>
    </div>
  );
}

export function SelectedFile({ file, onClear, detail }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
        <p className="text-xs text-gray-500">
          {formatBytes(file.size)}
          {detail ? ` · ${detail}` : ""}
        </p>
      </div>
      <Button variant="secondary" onClick={onClear}>
        Choose another
      </Button>
    </div>
  );
}

export function IconButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
      {...props}
    >
      {children}
    </button>
  );
}
