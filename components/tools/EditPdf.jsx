"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Highlighter, ImagePlus, MousePointer2, Pencil, Save, Trash2, Type, Undo2 } from "lucide-react";
import { Button, ErrorNote, FileDrop, Progress, ResultFile, SelectedFile } from "./ui";
import { LINE_HEIGHT, TEXT_FONT } from "@/lib/editText";
import { canvasToBlob, drawImage, loadImage } from "@/lib/images";
import { baseName, downloadBlob } from "@/lib/files";

const TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2, hint: "Click an item to select it and drag to move it. Double-click text to change it." },
  { id: "text", label: "Text", icon: Type, hint: "Click anywhere on a page to start typing." },
  { id: "draw", label: "Draw", icon: Pencil, hint: "Drag on a page to draw, for example to sign." },
  { id: "highlight", label: "Highlight", icon: Highlighter, hint: "Drag over text to highlight it." },
  { id: "whiteout", label: "White-out", icon: Eraser, hint: "Drag to cover content with white. To replace text, cover it, then add new text on top." },
  { id: "image", label: "Image", icon: ImagePlus, hint: "Click on a page to place the image." },
];
const INK_COLORS = ["#111827", "#dc2626", "#2563eb", "#16a34a"];
const HIGHLIGHT_COLORS = ["#facc15", "#4ade80", "#60a5fa", "#f472b6"];
const TEXT_SIZES = [10, 12, 14, 18, 24, 32];
const STROKE_WIDTHS = [1, 2, 4, 8];
const MAX_PAGE_WIDTH = 900;
const RENDER_SCALE = 1.5;

let nextId = 1;
let measureContext;

function measureText(text, size) {
  measureContext ??= document.createElement("canvas").getContext("2d");
  measureContext.font = `${size}px ${TEXT_FONT}`;
  const lines = text.split("\n");
  return {
    width: Math.max(...lines.map((line) => measureContext.measureText(line).width)),
    height: lines.length * size * LINE_HEIGHT,
  };
}

/** Follows the pointer until release, reporting movement in page points. */
function dragWithPointer(e, scale, onMove, onEnd) {
  const startX = e.clientX;
  const startY = e.clientY;
  const move = (ev) => onMove((ev.clientX - startX) / scale, (ev.clientY - startY) / scale);
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    onEnd?.();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function movedBy(obj, dx, dy) {
  if (obj.type === "path") return { ...obj, points: obj.points.map(([x, y]) => [x + dx, y + dy]) };
  return { ...obj, x: obj.x + dx, y: obj.y + dy };
}

// PDFs can only hold JPG and PNG, so other image types are converted to PNG up front.
async function readImage(file) {
  const img = await loadImage(file);
  let blob = file;
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    blob = await canvasToBlob(drawImage(img, img.naturalWidth, img.naturalHeight, "image/png"), "image/png");
  }
  const src = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  return { src, w: img.naturalWidth, h: img.naturalHeight };
}

export default function EditPdf() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(null);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tool, setTool] = useState("text");
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
  const [textSize, setTextSize] = useState(14);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [pendingImage, setPendingImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [width, setWidth] = useState(0);
  const viewportsRef = useRef([]);
  const objectsRef = useRef(objects);
  const historyRef = useRef([]);
  const wrapperRef = useRef(null);
  const imageInputRef = useRef(null);
  objectsRef.current = objects;

  const selected = objects.find((o) => o.id === selectedId);

  useEffect(() => setResult(null), [objects]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [pages.length > 0]);

  // Saves the current state so the next change can be undone.
  const remember = () => historyRef.current.push(objectsRef.current);
  const update = (id, change) => setObjects((prev) => prev.map((o) => (o.id === id ? change(o) : o)));
  const add = (obj) => setObjects((prev) => [...prev, obj]);

  const undo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    setObjects(previous);
    setSelectedId(null);
    setEditingId(null);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    remember();
    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
    setEditingId(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (editingId || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pickFile = async ([next]) => {
    setError(null);
    setFile(next);
    setPages([]);
    setObjects([]);
    historyRef.current = [];
    setLoading("Opening PDF…");
    try {
      const { openPdf, renderPageToCanvas } = await import("@/lib/pdf");
      const pdf = await openPdf(next);
      const loaded = [];
      const viewports = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        setLoading(`Loading page ${n} of ${pdf.numPages}…`);
        viewports.push((await pdf.getPage(n)).getViewport({ scale: 1 }));
        const { canvas, width: w, height: h } = await renderPageToCanvas(pdf, n, RENDER_SCALE);
        loaded.push({ background: canvas.toDataURL("image/jpeg", 0.85), width: w, height: h });
      }
      viewportsRef.current = viewports;
      setPages(loaded);
    } catch (err) {
      setError(err.message);
      setFile(null);
    } finally {
      setLoading(null);
    }
  };

  const chooseTool = (id) => {
    if (id === "image") {
      imageInputRef.current?.click();
      return;
    }
    setTool(id);
    setPendingImage(null);
    if (id !== "select") setSelectedId(null);
  };

  const onImageChosen = async (imageFile) => {
    if (!imageFile) return;
    try {
      setPendingImage(await readImage(imageFile));
      setTool("image");
      setSelectedId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Colour and size controls also restyle the selected item.
  const applyStyle = (change) => {
    if (!selected) return;
    remember();
    update(selected.id, change);
  };
  const pickInk = (c) => {
    setInkColor(c);
    if (selected?.type === "text" || selected?.type === "path") applyStyle((o) => ({ ...o, color: c }));
  };
  const pickHighlight = (c) => {
    setHighlightColor(c);
    if (selected?.kind === "highlight") applyStyle((o) => ({ ...o, color: c }));
  };
  const pickTextSize = (s) => {
    setTextSize(s);
    if (selected?.type === "text") applyStyle((o) => ({ ...o, size: s }));
  };
  const pickStroke = (w) => {
    setStrokeWidth(w);
    if (selected?.type === "path") applyStyle((o) => ({ ...o, width: w }));
  };

  const onPagePointerDown = (e, pageIndex, scale) => {
    if (e.button !== 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / scale;
    const y = (e.clientY - box.top) / scale;
    const base = { id: nextId++, page: pageIndex };

    if (tool === "select") {
      setSelectedId(null);
      setEditingId(null);
    } else if (tool === "text") {
      e.preventDefault();
      remember();
      add({ ...base, type: "text", x, y: y - (textSize * LINE_HEIGHT) / 2, text: "", size: textSize, color: inkColor });
      setSelectedId(base.id);
      setEditingId(base.id);
    } else if (tool === "draw") {
      e.preventDefault();
      remember();
      add({ ...base, type: "path", points: [[x, y]], color: inkColor, width: strokeWidth });
      dragWithPointer(e, scale, (dx, dy) =>
        update(base.id, (o) => ({ ...o, points: [...o.points, [x + dx, y + dy]] })),
      );
    } else if (tool === "highlight" || tool === "whiteout") {
      e.preventDefault();
      remember();
      const kind = tool;
      add({ ...base, type: "rect", kind, x, y, w: 0, h: 0, color: kind === "highlight" ? highlightColor : "#ffffff" });
      dragWithPointer(
        e,
        scale,
        (dx, dy) => update(base.id, (o) => ({ ...o, x: Math.min(x, x + dx), y: Math.min(y, y + dy), w: Math.abs(dx), h: Math.abs(dy) })),
        () => {
          const rect = objectsRef.current.find((o) => o.id === base.id);
          // A click without a drag shouldn't leave an invisible box behind.
          if (rect && (rect.w < 3 || rect.h < 3)) setObjects(historyRef.current.pop());
        },
      );
    } else if (tool === "image" && pendingImage) {
      remember();
      const w = Math.min(pendingImage.w * 0.75, pages[pageIndex].width * 0.4);
      const h = (w * pendingImage.h) / pendingImage.w;
      add({ ...base, type: "image", x: x - w / 2, y: y - h / 2, w, h, src: pendingImage.src });
      setPendingImage(null);
      setTool("select");
      setSelectedId(base.id);
    }
  };

  const onItemPointerDown = (e, obj, scale) => {
    if (e.button !== 0) return;
    // Drawing tools work over existing items; only Select and Text interact with them.
    if (tool !== "select" && !(tool === "text" && obj.type === "text")) return;
    e.stopPropagation();
    if (tool === "text") {
      setSelectedId(obj.id);
      setEditingId(obj.id);
      return;
    }
    if (editingId === obj.id) return;
    e.preventDefault();
    setSelectedId(obj.id);
    setEditingId(null);
    remember();
    let moved = false;
    dragWithPointer(
      e,
      scale,
      (dx, dy) => {
        moved = true;
        update(obj.id, () => movedBy(obj, dx, dy));
      },
      () => {
        if (!moved) historyRef.current.pop();
      },
    );
  };

  const onResizePointerDown = (e, obj, scale) => {
    e.stopPropagation();
    e.preventDefault();
    remember();
    dragWithPointer(e, scale, (dx, dy) => {
      // Images keep their proportions; boxes stretch freely.
      const w = Math.max(8, obj.w + dx);
      const size = obj.type === "image" ? { w, h: (w * obj.h) / obj.w } : { w, h: Math.max(3, obj.h + dy) };
      update(obj.id, (o) => ({ ...o, ...size }));
    });
  };

  const finishEditing = (obj) => {
    setEditingId(null);
    if (!obj.text.trim()) setObjects((prev) => prev.filter((o) => o.id !== obj.id));
  };

  const save = async () => {
    setError(null);
    setEditingId(null);
    setSaving(true);
    try {
      const { applyEdits } = await import("@/lib/editPdf");
      const blob = await applyEdits(file, objectsRef.current.filter((o) => o.type !== "text" || o.text.trim()), viewportsRef.current);
      setResult({ blob, name: `${baseName(file.name)}-edited.pdf` });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!file) {
    return (
      <FileDrop
        accept="application/pdf,.pdf"
        onFiles={pickFile}
        title="Drop a PDF here"
        hint="Add text, drawings, highlights, images and white-out"
        buttonLabel="Choose PDF"
        error={error}
      />
    );
  }

  const activeTool = TOOLS.find((t) => t.id === tool);
  const showInk = tool === "text" || tool === "draw" || selected?.type === "text" || selected?.type === "path";
  const showTextSize = tool === "text" || selected?.type === "text";
  const showStroke = tool === "draw" || selected?.type === "path";
  const showHighlight = tool === "highlight" || selected?.kind === "highlight";
  const cursor = { text: "text", draw: "crosshair", highlight: "crosshair", whiteout: "crosshair", image: "copy" }[tool] ?? "default";
  const drawing = tool === "draw" || tool === "highlight" || tool === "whiteout";

  return (
    <>
      <SelectedFile
        file={file}
        detail={pages.length ? `${pages.length} pages` : undefined}
        onClear={() => {
          if (objects.length && !window.confirm("Discard your edits to this PDF?")) return;
          setFile(null);
        }}
      />

      {loading && <Progress>{loading}</Progress>}

      {pages.length > 0 && (
        <>
          <div className="sticky top-0 z-20 -mx-4 space-y-2 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white/95 sm:shadow-sm">
            <div className="flex flex-wrap items-center gap-1">
              {TOOLS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseTool(id)}
                  aria-pressed={tool === id}
                  title={label}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium ${
                    tool === id ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={17} />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}

              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={undo} disabled={!historyRef.current.length} title="Undo (Ctrl+Z)" aria-label="Undo" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                  <Undo2 size={17} />
                </button>
                <button type="button" onClick={removeSelected} disabled={!selected} title="Delete selected (Del)" aria-label="Delete selected" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-red-600 disabled:opacity-30">
                  <Trash2 size={17} />
                </button>
                <Button onClick={save} disabled={saving || objects.length === 0} className="ml-1 px-3 py-2">
                  <Save size={16} />
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>

            {(showInk || showTextSize || showStroke || showHighlight) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {showTextSize && (
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Size
                    <select value={selected?.type === "text" ? selected.size : textSize} onChange={(e) => pickTextSize(Number(e.target.value))} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm">
                      {TEXT_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {showStroke && (
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Thickness
                    <select value={selected?.type === "path" ? selected.width : strokeWidth} onChange={(e) => pickStroke(Number(e.target.value))} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm">
                      {STROKE_WIDTHS.map((w) => (
                        <option key={w} value={w}>
                          {w} pt
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {showInk && <Swatches colors={INK_COLORS} value={selected?.color && selected.type !== "rect" ? selected.color : inkColor} onPick={pickInk} />}
                {showHighlight && <Swatches colors={HIGHLIGHT_COLORS} value={selected?.kind === "highlight" ? selected.color : highlightColor} onPick={pickHighlight} />}
              </div>
            )}

            <p className="text-xs text-gray-500">{activeTool.hint}</p>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <ResultFile name={result.name} blob={result.blob} onDownload={() => downloadBlob(result.blob, result.name)} />}

          <div ref={wrapperRef} className="space-y-6">
            {width > 0 &&
              pages.map((page, pageIndex) => {
                const scale = Math.min(width, MAX_PAGE_WIDTH) / page.width;
                return (
                  <div
                    key={pageIndex}
                    data-page={pageIndex + 1}
                    onPointerDown={(e) => onPagePointerDown(e, pageIndex, scale)}
                    className={`relative mx-auto select-none bg-white shadow-sm ring-1 ring-gray-200 ${drawing ? "touch-none" : ""}`}
                    style={{ width: page.width * scale, height: page.height * scale, cursor }}
                  >
                    <img src={page.background} alt={`Page ${pageIndex + 1}`} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />

                    {objects
                      .filter((o) => o.page === pageIndex && o.type !== "path")
                      .map((obj) => (
                        <Item
                          key={obj.id}
                          obj={obj}
                          scale={scale}
                          selected={obj.id === selectedId}
                          editing={obj.id === editingId}
                          onPointerDown={(e) => onItemPointerDown(e, obj, scale)}
                          onResizePointerDown={(e) => onResizePointerDown(e, obj, scale)}
                          onStartEditing={() => {
                            setSelectedId(obj.id);
                            setEditingId(obj.id);
                          }}
                          onTextChange={(text) => update(obj.id, (o) => ({ ...o, text }))}
                          onFinishEditing={() => finishEditing(obj)}
                        />
                      ))}

                    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${page.width} ${page.height}`}>
                      {objects
                        .filter((o) => o.page === pageIndex && o.type === "path")
                        .map((obj) => {
                          const points = obj.points.map((p) => p.join(",")).join(" ");
                          return (
                            <g key={obj.id} onPointerDown={(e) => onItemPointerDown(e, obj, scale)} style={{ pointerEvents: tool === "select" ? "stroke" : "none", cursor: "move" }}>
                              {/* A wide invisible stroke makes thin lines easier to grab. */}
                              <polyline points={points} fill="none" stroke="transparent" strokeWidth={Math.max(obj.width, 10)} strokeLinecap="round" strokeLinejoin="round" />
                              <polyline
                                points={points}
                                fill="none"
                                stroke={obj.color}
                                strokeWidth={obj.width}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={obj.id === selectedId ? { filter: "drop-shadow(0 0 2px #6366f1)" } : undefined}
                              />
                            </g>
                          );
                        })}
                    </svg>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onImageChosen(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}

function Swatches({ colors, value, onPick }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Colour">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onPick(c)}
          style={{ backgroundColor: c }}
          className={`h-6 w-6 rounded-full ring-offset-2 ${value === c ? "ring-2 ring-indigo-500" : "ring-1 ring-gray-300"}`}
        />
      ))}
    </div>
  );
}

function Item({ obj, scale, selected, editing, onPointerDown, onResizePointerDown, onStartEditing, onTextChange, onFinishEditing }) {
  const outline = selected ? "outline outline-2 outline-offset-2 outline-indigo-500" : "";
  const box = { left: obj.x * scale, top: obj.y * scale };

  if (obj.type === "text") {
    const textStyle = {
      ...box,
      fontFamily: TEXT_FONT,
      fontSize: obj.size * scale,
      lineHeight: LINE_HEIGHT,
      color: obj.color,
    };
    if (editing) {
      const { width, height } = measureText(obj.text || " ", obj.size);
      return (
        <textarea
          autoFocus
          value={obj.text}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={onFinishEditing}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
          spellCheck={false}
          aria-label="Text"
          placeholder="Type here"
          style={{ ...textStyle, width: Math.max(width + obj.size, obj.size * 6) * scale, height: height * scale }}
          className="absolute resize-none overflow-hidden whitespace-pre border-0 bg-white/60 p-0 outline-dashed outline-1 outline-indigo-500 placeholder:text-gray-400 focus:ring-0"
        />
      );
    }
    return (
      <div
        onPointerDown={onPointerDown}
        onDoubleClick={onStartEditing}
        style={textStyle}
        className={`absolute cursor-move whitespace-pre ${outline}`}
      >
        {obj.text}
      </div>
    );
  }

  const style = { ...box, width: obj.w * scale, height: obj.h * scale };
  return (
    <div onPointerDown={onPointerDown} style={style} className={`absolute cursor-move ${outline}`}>
      {obj.type === "image" ? (
        <img src={obj.src} alt="" draggable={false} className="pointer-events-none h-full w-full" />
      ) : (
        <div
          className="h-full w-full"
          style={{ backgroundColor: obj.color, opacity: obj.kind === "highlight" ? 0.35 : 1, mixBlendMode: obj.kind === "highlight" ? "multiply" : "normal" }}
        />
      )}
      {selected && (
        <span
          onPointerDown={onResizePointerDown}
          aria-hidden
          className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border-2 border-indigo-500 bg-white"
        />
      )}
    </div>
  );
}
