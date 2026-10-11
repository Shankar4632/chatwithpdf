# PDF Toolkit

Chat with your PDFs using Google Gemini, plus image and PDF tools that run
entirely in the browser. Built with Next.js (App Router), React and Tailwind
CSS, in plain JSX.

## Tools

| Tool             | What it does                                                               |
| ---------------- | -------------------------------------------------------------------------- |
| Chat with PDF    | Ask questions about a PDF (uses the Gemini API)                            |
| Resize image     | Set width and height in pixels or by percentage                            |
| Convert image    | Batch-convert to JPG, PNG or WEBP (AVIF where the browser supports it)      |
| Compress image   | Batch-shrink images by quality and maximum size                            |
| Edit PDF         | Add text, drawings, highlights, white-out and images (e.g. a signature)    |
| PDF to Word      | Editable text (paragraphs, headings, bullets) or "exact look" page images  |
| Word to PDF      | .docx to PDF with selectable text, lists, tables and pictures              |
| Images to PDF    | Combine images into one PDF, one per page, in any order                    |
| PDF to images    | Save each page as PNG or JPG, individually or as a .zip                    |
| Compress PDF     | Basic (keeps text) or Strong (pages become compressed images)              |
| Rotate & reorder | Rotate, reorder and delete PDF pages                                       |

Everything except the chat runs in the browser, so those files are never
uploaded anywhere.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your Gemini API key
   (get one at https://aistudio.google.com/apikey):

   ```bash
   GEMINI_API_KEY=your-key-here
   # Optional, defaults to gemini-3.8-flash
   GEMINI_MODEL=gemini-3.8-flash
   ```

3. Start the dev server and open http://localhost:3000:

   ```bash
   npm run dev
   ```

`npm run dev` and `npm run build` first copy pdf.js's fonts, character maps
and image decoders into `public/pdfjs` (see `scripts/copy-pdfjs-assets.mjs`).

## Structure

```
app/
  layout.js              Root layout: sidebar + page (AppShell)
  page.js                Chat with PDF
  <tool>/page.js         One route per tool (resize-image, pdf-to-word, ...)
  api/chat/route.js      Sends the PDF, chat history and question to Gemini
components/
  AppShell.jsx           Sidebar, mobile menu, shared chat state
  Sidebar.jsx            Tool navigation (the list lives in lib/site.js)
  TopBar.jsx, PdfViewer.jsx, PdfDocument.jsx, ChatPanel.jsx, ...   Chat UI
  tools/ui.jsx           Shared tool UI: page layout, dropzone, buttons, fields
  tools/ImageBatch.jsx   Multi-image list used by Convert and Compress image
  tools/*.jsx            One component per tool
lib/
  site.js                Site name and sidebar navigation
  images.js              Canvas-based image loading, resizing and encoding
  pdf.js                 pdf.js helpers (open, render pages, error messages)
  editPdf.js             Saves Edit PDF changes into the file
  pdfToDocx.js           PDF to Word conversion
  docxToPdf.js           Word to PDF conversion
  files.js               Download, file size formatting, zip
```

## Notes

- Chat PDFs are limited to 20 MB, because the whole file is sent inline to
  Gemini with every question. Nothing is stored on the server.
- PDF ↔ Word conversion happens in the browser, so complex layouts are
  simplified: PDF to Word doesn't keep columns, tables or images in
  "Editable text" mode, and Word to PDF uses the Roboto font, which covers
  Latin, Greek and Cyrillic scripts only.
- Edit PDF can't change a PDF's existing text in place (PDFs store positioned
  letters, not paragraphs). Cover it with White-out and type over it instead.
  Added text uses Helvetica, so it supports Latin-alphabet languages only.
- To rename the site, change `SITE_NAME` in `lib/site.js`.
