"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Logo from "./Logo";
import { PdfProvider } from "./PdfContext";
import { SITE_NAME } from "@/lib/site";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    // The provider lives here so the chat survives a trip to another tool and back.
    <PdfProvider>
      <div className="flex h-dvh w-full bg-white">
        <aside className="hidden w-60 shrink-0 border-r border-gray-100 lg:block">
          <Sidebar />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-gray-900/30"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
            >
              <Menu size={22} />
            </button>
            <Logo size={26} />
            <span className="font-bold text-gray-900">{SITE_NAME}</span>
          </header>

          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </PdfProvider>
  );
}
