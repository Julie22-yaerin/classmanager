"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LaurelAvatar from "@/components/LaurelAvatar";

const LINKS = [
  { href: "/", label: "Chat" },
  { href: "/setup", label: "Teachers & Classes" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-zinc-950 text-zinc-300">
      <div className="flex items-center gap-2 px-4 py-4">
        <LaurelAvatar size={28} />
        <span className="text-sm font-semibold text-zinc-50">School AI</span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-4 py-4 text-[11px] text-zinc-600">DRM v0.3 — School AI</div>
    </aside>
  );
}
