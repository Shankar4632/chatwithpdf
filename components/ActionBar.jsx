"use client";

import { RotateCcw } from "lucide-react";

export default function ActionBar({ onStartOver, onDownload }) {
  return (
    <div className="flex items-center justify-end gap-6 px-8 py-4">
      <button
        type="button"
        onClick={onStartOver}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <RotateCcw size={16} />
        Start over
      </button>

      <button
        type="button"
        onClick={onDownload}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
      >
        Download
      </button>
    </div>
  );
}
