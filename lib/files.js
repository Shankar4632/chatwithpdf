export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Give the browser a moment to start the download before freeing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** "photo.final.png" + "jpg" -> "photo.final.jpg" */
export function withExtension(filename, ext) {
  const base = filename.replace(/\.[^./\\]+$/, "");
  return `${base}.${ext}`;
}

export function baseName(filename) {
  return filename.replace(/\.[^./\\]+$/, "");
}

/** Zips [{ name, blob }] into one .zip blob, renaming duplicates. */
export async function zipFiles(entries) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set();
  for (const { name, blob } of entries) {
    let unique = name;
    for (let n = 2; used.has(unique); n++) unique = `${baseName(name)} (${n})${name.slice(baseName(name).length)}`;
    used.add(unique);
    zip.file(unique, blob);
  }
  return zip.generateAsync({ type: "blob" });
}
