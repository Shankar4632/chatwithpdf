import ReactMarkdown from "react-markdown";
import { AlertCircle, Sparkles } from "lucide-react";

export default function AssistantMessage({ text, error = false }) {
  return (
    <div className="flex items-start gap-3 px-5 py-2">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
          error ? "bg-red-500" : "bg-indigo-600"
        }`}
      >
        {error ? <AlertCircle size={16} /> : <Sparkles size={16} />}
      </span>

      <div
        className={`chat-markdown min-w-0 rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] leading-relaxed shadow-sm ring-1 ${
          error ? "bg-red-50 text-red-800 ring-red-100" : "bg-white text-gray-800 ring-gray-100"
        }`}
      >
        {error ? <p>{text}</p> : <ReactMarkdown>{text}</ReactMarkdown>}
      </div>
    </div>
  );
}
