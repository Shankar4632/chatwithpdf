import { Sparkles } from "lucide-react";

export default function AssistantMessage({ intro, items }) {
  return (
    <div className="flex items-start gap-3 px-6 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-400 text-white">
        <Sparkles size={16} />
      </span>

      <div className="max-w-full rounded-2xl bg-indigo-50 px-5 py-4 text-[15px] leading-relaxed text-gray-800">
        {intro && <p className="mb-3">{intro}</p>}

        {items && (
          <ol className="space-y-3">
            {items.map((item, i) => (
              <li key={item.label}>
                <span className="font-semibold">
                  {i + 1}. {item.label}
                </span>{" "}
                — {item.detail}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
