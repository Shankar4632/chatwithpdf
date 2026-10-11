// Copies the font, character map and image decoder files pdf.js loads at runtime into
// public/pdfjs, so PDFs with non-embedded fonts, Asian scripts or scanned images render correctly.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfjsDir = path.dirname(require.resolve("pdfjs-dist/package.json"));

for (const dir of ["cmaps", "standard_fonts", "wasm"]) {
  fs.cpSync(path.join(pdfjsDir, dir), path.join("public", "pdfjs", dir), { recursive: true });
}
