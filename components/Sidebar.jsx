"use client";

import {
  Minimize2,
  RefreshCcw,
  LayoutGrid,
  Type,
  PenLine,
  Sparkles,
  MoreHorizontal,
  FolderClosed,
  CircleUserRound,
} from "lucide-react";
import Logo from "./Logo";

const tools = [
  { icon: Minimize2, label: "Compress" },
  { icon: RefreshCcw, label: "Convert" },
  { icon: LayoutGrid, label: "Organize" },
  { icon: Type, label: "Edit" },
  { icon: PenLine, label: "Sign" },
  { icon: Sparkles, label: "AI PDF", active: true },
  { icon: MoreHorizontal, label: "More" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-24 shrink-0 flex-col items-center border-r border-gray-100 bg-white py-5">
      <div className="mb-6">
        <Logo size={34} />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {tools.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            type="button"
            className={`flex w-20 flex-col items-center gap-1 rounded-xl py-3 text-[11px] font-medium transition-colors ${
              active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Icon size={20} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          type="button"
          className="flex w-20 flex-col items-center gap-1 rounded-xl py-3 text-[11px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <FolderClosed size={20} strokeWidth={1.75} />
          Documents
        </button>
        <button
          type="button"
          className="flex w-20 flex-col items-center gap-1 rounded-xl py-3 text-[11px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <CircleUserRound size={20} strokeWidth={1.75} />
          Account
        </button>
      </div>
    </aside>
  );
}
