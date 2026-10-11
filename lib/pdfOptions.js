// pdf.js loads these on demand; scripts/copy-pdfjs-assets.mjs puts them in public/pdfjs.
export const PDFJS_OPTIONS = {
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  wasmUrl: "/pdfjs/wasm/",
};
