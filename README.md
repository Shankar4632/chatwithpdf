# Chat with PDF — UI Clone

A Next.js (App Router) + Tailwind CSS recreation of the "Chat with PDF" layout:
a left icon rail, a document preview panel, and a right-hand chat panel with
a message list and input composer. Written in plain JSX (no TypeScript).

## Structure

```
app/
  layout.js        Root layout, imports globals.css
  page.js           Assembles the full layout
  globals.css       Tailwind directives
components/
  Sidebar.jsx       Left icon rail (Compress, Convert, Organize, Edit, Sign, AI PDF...)
  TopBar.jsx        "Chat with PDF" title + user avatar
  ActionBar.jsx     "Start over" / "Download" controls
  PdfViewer.jsx     Document preview + floating page/zoom pill
  ChatPanel.jsx     Scrollable messages + input composer
  UserMessage.jsx   User message row
  AssistantMessage.jsx  Assistant reply card
  Logo.jsx          4-color logo mark reused as app icon / avatar
```

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Customizing

- Swap the placeholder page preview in `PdfViewer.jsx` for real PDF rendering
  (e.g. `react-pdf` or `pdfjs-dist`).
- Wire `ChatPanel.jsx`'s `handleSubmit` up to your chat/completions API.
- Colors live in `tailwind.config.js` (`brandBlue`, `panel`) — adjust to taste.
