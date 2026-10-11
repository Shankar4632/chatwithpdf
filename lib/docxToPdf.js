// Browser-only: converts a .docx to a PDF with selectable text. Load with `await import("@/lib/docxToPdf")`.
import mammoth from "mammoth";
import htmlToPdfmake from "html-to-pdfmake";
import pdfMake from "pdfmake/build/pdfmake";
import vfs from "pdfmake/build/vfs_fonts";

pdfMake.addVirtualFileSystem(vfs);

const MARGIN = 56; // about 2 cm
const CONTENT_WIDTH = 595.28 - MARGIN * 2; // A4 width in points, minus margins
const CONTENT_HEIGHT = 841.89 - MARGIN * 2;

// Word images can be any size; shrink each one to fit the page instead of running off the edge.
function fitImages(node) {
  if (Array.isArray(node)) {
    node.forEach(fitImages);
  } else if (node && typeof node === "object") {
    if (node.image) {
      node.fit = [Math.min(node.width ?? CONTENT_WIDTH, CONTENT_WIDTH), CONTENT_HEIGHT];
      delete node.width;
      delete node.height;
    }
    Object.values(node).forEach(fitImages);
  }
}

export async function docxToPdf(file) {
  let html;
  try {
    ({ value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }));
  } catch {
    throw new Error("This file couldn't be read. Make sure it's a .docx file (not the older .doc format).");
  }

  // pdfmake can only draw PNG and JPG; drop other embedded image types (EMF, WMF, TIFF, ...).
  const page = new DOMParser().parseFromString(html, "text/html");
  page.querySelectorAll("img").forEach((img) => {
    if (!/^data:image\/(png|jpe?g);/i.test(img.getAttribute("src") ?? "")) img.remove();
  });

  const content = htmlToPdfmake(page.body.innerHTML, { tableAutoSize: true });
  fitImages(content);

  return pdfMake
    .createPdf({
      content,
      pageSize: "A4",
      pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN],
      defaultStyle: { fontSize: 11, lineHeight: 1.2 },
    })
    .getBlob();
}
