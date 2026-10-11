export const IMAGE_FORMATS = [
  { mime: "image/jpeg", label: "JPG", ext: "jpg", lossy: true },
  { mime: "image/png", label: "PNG", ext: "png", lossy: false },
  { mime: "image/webp", label: "WEBP", ext: "webp", lossy: true },
  { mime: "image/avif", label: "AVIF", ext: "avif", lossy: true },
];

// Browsers can read more formats than they can write; only offer the ones this browser can encode.
export function encodableFormats() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  return IMAGE_FORMATS.filter((f) => canvas.toDataURL(f.mime).startsWith(`data:${f.mime}`));
}

export function formatForMime(mime) {
  return IMAGE_FORMATS.find((f) => f.mime === mime) ?? IMAGE_FORMATS[1];
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Your browser can't open "${file.name}" as an image.`));
    };
    img.src = url;
  });
}

export function drawImage(img, width, height, mime) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  // JPG has no transparency, so give see-through areas a white background instead of black.
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser couldn't create the image."))),
      mime,
      quality,
    );
  });
}

/** Re-encodes an image file, optionally scaling it so neither side exceeds maxSide. */
export async function reencodeImage(file, { mime, quality, width, height, maxSide }) {
  const img = await loadImage(file);
  let w = width ?? img.naturalWidth;
  let h = height ?? img.naturalHeight;
  if (maxSide && Math.max(w, h) > maxSide) {
    const scale = maxSide / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  return canvasToBlob(drawImage(img, w, h, mime), mime, quality);
}
