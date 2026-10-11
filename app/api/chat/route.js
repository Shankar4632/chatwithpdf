import { GoogleGenAI } from "@google/genai";

// Reads the key from .env.local — never hardcode it here.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_HISTORY = 10;

const SYSTEM_INSTRUCTION = `You answer questions about the PDF the user attached.
Base your answers on the document. If the document doesn't contain the answer, say so plainly.
Mention page numbers when you can. Use Markdown for lists and emphasis, and keep answers concise.`;

export async function POST(req) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "The server has no GEMINI_API_KEY. Add it to .env.local and restart the dev server." },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const { question, pdfBase64, history = [] } = body;
  if (!question || !pdfBase64) {
    return Response.json(
      { error: "Missing question or pdfBase64 in request body." },
      { status: 400 },
    );
  }

  // The PDF rides along with the first turn so earlier messages keep their context.
  const turns = [
    ...history.slice(-MAX_HISTORY).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.text ?? "") }],
    })),
    { role: "user", parts: [{ text: question }] },
  ];
  turns[0] = {
    ...turns[0],
    parts: [{ inlineData: { mimeType: "application/pdf", data: pdfBase64 } }, ...turns[0].parts],
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: turns,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const answer = response.text?.trim();
    if (!answer) {
      return Response.json(
        { error: "The model returned an empty answer. Try rephrasing your question." },
        { status: 502 },
      );
    }
    return Response.json({ answer });
  } catch (err) {
    console.error("Gemini API error:", err);
    return Response.json({ error: describeError(err) }, { status: 502 });
  }
}

function describeError(err) {
  // Gemini reports a bad key as a 400, so check for it before the generic 400 case.
  if (String(err?.message).includes("API_KEY_INVALID") || err?.status === 401 || err?.status === 403) {
    return "The Gemini API key was rejected. Check GEMINI_API_KEY in .env.local.";
  }
  switch (err?.status) {
    case 400:
      return "The AI model couldn't read this PDF. It may be encrypted or damaged.";
    case 404:
      return `The model "${MODEL}" isn't available. Set GEMINI_MODEL in .env.local.`;
    case 429:
      return "The AI model is rate limited right now. Wait a moment and try again.";
    default:
      return "Something went wrong talking to the AI model.";
  }
}
