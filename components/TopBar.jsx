"use client";

import { ChevronDown } from "lucide-react";

export default function TopBar({ userInitials = "ER" }) {
  return (
    <header className="flex items-center justify-between border-b border-gray-100 px-8 py-5">
      <h1 className="text-2xl font-bold text-gray-900">Chat with PDF</h1>

      <button type="button" className="flex items-center gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
          {userInitials}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>
    </header>
  );
}
