import type { Metadata } from "next";
import Link from "next/link";
import { Manrope } from "next/font/google";
import LaurelAvatar from "@/components/LaurelAvatar";
import styles from "./landing.module.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-manrope" });

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
    <div className={`${manrope.variable} flex min-h-screen flex-col text-[#fafafa]`} style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}>
      <div className={`${styles.stage} flex min-h-screen flex-col`}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.mist} aria-hidden="true" />

        <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/" className="flex items-center gap-2">
            <LaurelAvatar size={26} />
            <span className="text-sm font-semibold tracking-tight">Lyceum</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[#b6b5b5] sm:flex">
            <Link href="/privacy" className="transition-colors hover:text-[#fafafa]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#fafafa]">
              Terms
            </Link>
          </nav>
          <Link
            href="/login"
            className="rounded-full bg-[#fafafa] px-6 py-2.5 text-sm font-medium text-[#050505] transition-transform hover:scale-[1.03]"
          >
            Sign in
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-10">
          <h1 className={`${styles.headline} ${styles.enter} max-w-3xl font-semibold text-balance`}>
            <span className="block">One chat.</span>
            <span className="block">Command every class.</span>
          </h1>
          <p className={`${styles.enter} mt-6 max-w-xl text-base text-[#a7a6a6] sm:text-lg`} style={{ animationDelay: "0.14s" }}>
            It studies your teachers, your exams, your patterns — until nothing in school surprises you again.
          </p>
          <div className={`${styles.enter} mt-10 flex flex-wrap items-center justify-center gap-6`} style={{ animationDelay: "0.22s" }}>
            <Link
              href="/login"
              className="rounded-full bg-[#fafafa] px-8 py-3 text-sm font-semibold text-[#050505] transition-transform hover:scale-[1.02]"
            >
              Take command
            </Link>
            <a href="#capabilities" className="text-sm font-medium text-[#fafafa] underline decoration-[#5c5c5c] underline-offset-4 hover:decoration-[#fafafa]">
              See what it does
            </a>
          </div>
        </main>

        <section id="capabilities" className={`${styles.enter} relative z-10 mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 px-6 pb-20 sm:grid-cols-3 sm:px-10`} style={{ animationDelay: "0.34s" }}>
          {CAPABILITIES.map((c) => (
            <div key={c.label} className="border-t border-[#232323] pt-4 text-left">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#8b8a8a] uppercase">{c.label}</p>
              <p className="mt-2 text-sm text-[#a7a6a6]">{c.body}</p>
            </div>
          ))}
        </section>
      </div>

      <footer className="flex flex-col items-center gap-2 border-t border-[#161616] px-6 py-8 text-xs text-[#6a6a6a] sm:flex-row sm:justify-between sm:px-10">
        <span>© {new Date().getFullYear()} Lyceum</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-[#a7a6a6]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#a7a6a6]">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
