// Browser-only: builds a .docx from a PDF. Load with `await import("@/lib/pdfToDocx")`.
import { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { openPdf, renderPageToCanvas } from "./pdf";
import { canvasToBlob } from "./images";

const BULLET = /^[•◦▪▫●○■□‣⁃–-]\s+/;

/** Turns one page's text items into lines, keeping the reading order pdf.js gives us. */
function pageLines(items) {
  const lines = [];
  let line = null;
  for (const item of items) {
    if (!("str" in item) || (!item.str && !item.hasEOL)) continue;
    const [, , c, d, x, y] = item.transform;
    const size = Math.hypot(c, d) || item.height || 10;
    if (!line || Math.abs(y - line.y) > size * 0.5) {
      line = { y, size, text: "", endX: x };
      lines.push(line);
    }
    if (item.str) {
      // Add the space PDFs often leave out between separately placed words.
      const gap = x - line.endX;
      if (line.text && gap > size * 0.15 && !line.text.endsWith(" ") && !item.str.startsWith(" ")) line.text += " ";
      line.text += item.str;
      line.endX = x + item.width;
      line.size = Math.max(line.size, size);
    }
  }
  return lines.filter((l) => l.text.trim());
}

/** Merges lines into paragraphs, breaking on large gaps, font size changes and bullets. */
function linesToParagraphs(lines) {
  const paragraphs = [];
  let current = null;
  let prev = null;
  for (const line of lines) {
    const text = line.text.trim();
    const isBullet = BULLET.test(text);
    const startsNew =
      !current ||
      isBullet ||
      Math.abs(line.size - prev.size) > prev.size * 0.15 ||
      prev.y - line.y > line.size * 1.8 ||
      line.y > prev.y; // jumped up: a new column or block
    if (startsNew) {
      current = { text: isBullet ? text.replace(BULLET, "") : text, size: line.size, bullet: isBullet };
      paragraphs.push(current);
    } else if (current.text.endsWith("-") && /^[a-z]/.test(text)) {
      current.text = current.text.slice(0, -1) + text; // re-join a hyphenated word
    } else {
      current.text += ` ${text}`;
    }
    prev = line;
  }
  return paragraphs;
}

/** The most common font size, weighted by amount of text, is treated as body text. */
function bodySize(paragraphs) {
  const weights = new Map();
  for (const p of paragraphs) {
    const key = Math.round(p.size);
    weights.set(key, (weights.get(key) ?? 0) + p.text.length);
  }
  return [...weights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 12;
}

export async function pdfToEditableDocx(file, onProgress) {
  const pdf = await openPdf(file);
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.(n, pdf.numPages);
    const page = await pdf.getPage(n);
    const { items } = await page.getTextContent();
    pages.push(linesToParagraphs(pageLines(items)));
    page.cleanup();
  }

  const all = pages.flat();
  const textLength = all.reduce((sum, p) => sum + p.text.length, 0);
  if (textLength < 20) {
    throw new Error(
      "This PDF has almost no selectable text. It's probably scanned, so try the \"Exact look\" mode instead.",
    );
  }

  const body = bodySize(all);
  const children = pages.flatMap((paragraphs, pageIndex) =>
    paragraphs.map((p, i) => {
      const heading =
        p.text.length < 200 && p.size >= body * 1.5
          ? HeadingLevel.HEADING_1
          : p.text.length < 200 && p.size >= body * 1.2
            ? HeadingLevel.HEADING_2
            : undefined;
      return new Paragraph({
        heading,
        bullet: p.bullet ? { level: 0 } : undefined,
        pageBreakBefore: pageIndex > 0 && i === 0,
        spacing: { after: 120 },
        children: [new TextRun(p.text)],
      });
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

export async function pdfToImageDocx(file, onProgress) {
  const pdf = await openPdf(file);
  const sections = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.(n, pdf.numPages);
    const { canvas, width, height } = await renderPageToCanvas(pdf, n, 2);
    const data = await (await canvasToBlob(canvas, "image/png")).arrayBuffer();
    sections.push({
      // Word measures pages in twips (1/20 point); keep each page the size it was in the PDF.
      properties: {
        page: {
          size: { width: Math.round(width * 20), height: Math.round(height * 20) },
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
        },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            // Images are sized in pixels at 96 dpi; shrink slightly so Word doesn't push it onto a new page.
            new ImageRun({
              type: "png",
              data,
              transformation: { width: Math.floor(width * (96 / 72) * 0.98), height: Math.floor(height * (96 / 72) * 0.98) },
            }),
          ],
        }),
      ],
    });
  }
  return Packer.toBlob(new Document({ sections }));
}
