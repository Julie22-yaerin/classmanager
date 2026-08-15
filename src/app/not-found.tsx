import type { Metadata } from "next";
import Link from "next/link";
import LaurelAvatar from "@/components/LaurelAvatar";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center dark:bg-[#212121]">
      <LaurelAvatar size={48} />
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Page not found</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        That page doesn&apos;t exist, or you don&apos;t have access to it. Let&apos;s get you back to your classes.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
      >
        Back to chat
      </Link>
    </div>
  );
}
