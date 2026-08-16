"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import LaurelAvatar from "@/components/LaurelAvatar";

const LINKS = [
  { href: "/app", label: "Chat" },
  { href: "/daily", label: "Daily" },
  { href: "/setup", label: "Classes" },
];

// Kept reachable but visually secondary: their content now lives directly on
// the chat home screen as widgets, so these are just the "see everything" links.
const SECONDARY_LINKS = [
  { href: "/deadlines", label: "Deadlines" },
  { href: "/predictions", label: "Predictions" },
];

function UserAvatar({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-white dark:bg-zinc-200 dark:text-zinc-900">
      {initial}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
      <div className="flex items-center gap-2 px-4 py-4">
        <LaurelAvatar size={28} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Lyceum</span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-amber-100/60 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <nav className="mt-2 flex flex-col gap-0.5 px-2">
        {SECONDARY_LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "bg-amber-100/60 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  : "text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 py-3">
        {user && (
          <Link
            href="/settings"
            className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-amber-100/60 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "hover:bg-zinc-200/60 dark:hover:bg-zinc-900"
            }`}
          >
            <UserAvatar email={user.email ?? ""} />
            <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">{user.email}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-zinc-400">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                stroke="currentColor"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.712 7.712 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </Link>
        )}
      </div>
    </aside>
  );
}
