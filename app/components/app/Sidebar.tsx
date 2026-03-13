"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Dashboard", href: "/app/dashboard" },
  { name: "Documents", href: "/app/documents" },
  { name: "Questions", href: "/app/questions" },
  { name: "Decisions", href: "/app/decisions" },
  { name: "Topics", href: "/app/topics" },
  { name: "Settings", href: "/app/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white text-black flex flex-col border-r border-black/10">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-black/10">
        <h1 className="text-base font-bold tracking-tight text-black">DocuMind</h1>
        <p className="text-xs text-black/40 mt-0.5">Document Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium transition-colors duration-150 rounded-sm ${
                active
                  ? "bg-black text-white"
                  : "text-black/60 hover:text-black hover:bg-black/5"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Workspace */}
      <div className="p-3 border-t border-black/10">
        <div className="px-3 py-2.5 rounded-sm text-xs text-black/40">
          <p className="font-semibold text-black/70 mb-0.5">Workspace</p>
          <p>Default</p>
        </div>
      </div>
    </aside>
  );
}