import { GoogleGenerativeAI } from "@google/generative-ai";

// Reads the key from .env.local — never hardcode it here.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { question, pdfBase64 } = await req.json();

    if (!question || !pdfBase64) {
      return Response.json(
        { error: "Missing question or pdfBase64 in request body." },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      },
      {
        text: `You are answering questions about the attached PDF. Question: ${question}`,
      },
    ]);

    const answer = result.response.text();
    return Response.json({ answer });
  } catch (err) {
    console.error("Gemini API error:", err);
    return Response.json(
      { error: "Something went wrong talking to the AI model." },
      { status: 500 },
    );
  }
}
