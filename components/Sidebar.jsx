"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { NAV, SITE_NAME } from "@/lib/site";

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col overflow-y-auto px-3 py-4" aria-label="Tools">
      <Link href="/" onClick={onNavigate} className="mb-6 flex items-center gap-2.5 px-2">
        <Logo size={30} />
        <span className="text-lg font-bold text-gray-900">{SITE_NAME}</span>
      </Link>

      {NAV.map((group) => (
        <div key={group.heading} className="mb-5">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {group.heading}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.75} className={active ? "text-indigo-600" : "text-gray-400"} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
