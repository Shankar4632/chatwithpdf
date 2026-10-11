// Browser-only: burns editor objects into a PDF. Load with `await import("@/lib/editPdf")`.
//
// Objects are measured in "view points": PDF points as the page is shown on screen
// (top-left origin, rotation applied). Each page's pdf.js viewport converts those back
// into the PDF's own coordinates, which handles rotated and cropped pages.
import { LineCapStyle, StandardFonts, degrees, rgb } from "pdf-lib";
import { loadPdfLib } from "./pdf";
import { BASELINE, LINE_HEIGHT } from "./editText";

function color(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function applyEdits(file, objects, viewports) {
  const pdf = await loadPdfLib(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const images = new Map();

  for (const obj of objects) {
    const page = pdf.getPage(obj.page);
    const viewport = viewports[obj.page];
    const toPdf = (x, y) => viewport.convertToPdfPoint(x, y);
    // Rotating with the page keeps text and images upright for the reader.
    const rotate = degrees(viewport.rotation);

    if (obj.type === "rect") {
      const [x1, y1] = toPdf(obj.x, obj.y);
      const [x2, y2] = toPdf(obj.x + obj.w, obj.y + obj.h);
      page.drawRectangle({
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        color: color(obj.color),
        opacity: obj.kind === "highlight" ? 0.35 : 1,
      });
    } else if (obj.type === "path") {
      for (let i = 1; i < obj.points.length; i++) {
        const [sx, sy] = toPdf(...obj.points[i - 1]);
        const [ex, ey] = toPdf(...obj.points[i]);
        page.drawLine({
          start: { x: sx, y: sy },
          end: { x: ex, y: ey },
          thickness: obj.width,
          color: color(obj.color),
          lineCap: LineCapStyle.Round,
        });
      }
    } else if (obj.type === "text") {
      const lines = obj.text.split("\n");
      for (const [i, line] of lines.entries()) {
        if (!line) continue;
        const [x, y] = toPdf(obj.x, obj.y + obj.size * (BASELINE + i * LINE_HEIGHT));
        try {
          page.drawText(line, { x, y, size: obj.size, font, color: color(obj.color), rotate });
        } catch {
          throw new Error(
            `"${line.slice(0, 30)}" uses characters the built-in font can't write. Only Latin-alphabet text is supported for now.`,
          );
        }
      }
    } else if (obj.type === "image") {
      if (!images.has(obj.src)) {
        const bytes = await (await fetch(obj.src)).arrayBuffer();
        images.set(obj.src, obj.src.startsWith("data:image/png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes));
      }
      // Images are anchored at their bottom-left corner as the reader sees it.
      const [x, y] = toPdf(obj.x, obj.y + obj.h);
      page.drawImage(images.get(obj.src), { x, y, width: obj.w, height: obj.h, rotate });
    }
  }

  return new Blob([await pdf.save()], { type: "application/pdf" });
}
