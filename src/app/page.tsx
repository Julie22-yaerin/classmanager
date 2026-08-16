import type { Metadata } from "next";
import Link from "next/link";
import LaurelAvatar from "@/components/LaurelAvatar";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

const CAPABILITIES = [
  { label: "Learns", body: "Every teacher's style, memorized after one upload." },
  { label: "Predicts", body: "Exam patterns before they're announced." },
  { label: "Answers", body: "Homework solved your teacher's way — not just any way." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050506] text-zinc-50">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <LaurelAvatar size={26} />
          <span className="text-sm font-semibold tracking-tight">Lyceum</span>
        </div>
        <Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50">
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
        <LaurelAvatar size={112} className="mb-10" />
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
          Command every class.
        </h1>
        <p className="mt-6 max-w-xl text-base text-zinc-400 sm:text-lg">
          One chat that studies your teachers, your exams, your patterns — until nothing in school surprises you again.
        </p>
        <Link
          href="/login"
          className="mt-10 rounded-full px-8 py-3 text-sm font-semibold text-zinc-950 transition-transform hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #f3cf6b 0%, #c8942f 100%)" }}
        >
          Take command
        </Link>
      </main>

      <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 px-6 pb-20 sm:grid-cols-3 sm:px-10">
        {CAPABILITIES.map((c) => (
          <div key={c.label} className="border-t border-zinc-800 pt-4 text-left">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c8942f] uppercase">{c.label}</p>
            <p className="mt-2 text-sm text-zinc-400">{c.body}</p>
          </div>
        ))}
      </section>

      <footer className="flex flex-col items-center gap-2 border-t border-zinc-900 px-6 py-8 text-xs text-zinc-600 sm:flex-row sm:justify-between sm:px-10">
        <span>© {new Date().getFullYear()} Lyceum</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-zinc-400">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-400">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
