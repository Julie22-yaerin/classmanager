"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import LaurelAvatar from "@/components/LaurelAvatar";

const LINKS = [
  { href: "/app", label: "Chat" },
  { href: "/daily", label: "Daily" },
  { href: "/setup", label: "Classes" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/predictions", label: "Predictions" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
      <div className="flex items-center gap-2 px-4 py-4">
        <LaurelAvatar size={28} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">School AI</span>
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
      <div className="mt-auto flex flex-col gap-2 px-4 py-4">
        {user && <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">{user.email}</p>}
        <button onClick={handleSignOut} className="self-start text-xs text-zinc-400 hover:text-zinc-700 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300">
          Sign out
        </button>
        <div className="text-[11px] text-zinc-300 dark:text-zinc-700">DRM v0.3 — School AI</div>
      </div>
    </aside>
  );
}
