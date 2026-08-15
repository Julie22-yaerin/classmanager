import type { Metadata } from "next";
import Link from "next/link";
import LaurelAvatar from "@/components/LaurelAvatar";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using School AI.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <Link href="/" className="flex items-center gap-2 self-start">
        <LaurelAvatar size={28} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">School AI</span>
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Terms of Service</h1>
        <p className="mt-1 text-xs text-zinc-500">Last updated: {new Date().toISOString().slice(0, 10)}</p>
      </div>

      <p>By creating an account and using School AI, you agree to the following.</p>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">What this is</h2>
        <p className="mt-2">
          School AI is a study aid: it helps organize your classes, explain homework, analyze past exams, and prepare
          study materials. It is not a substitute for your own understanding, your teacher&apos;s instruction, or your
          school&apos;s academic integrity policy. You&apos;re responsible for using it in line with whatever rules your
          school or teacher has around AI assistance — including, where relevant, disclosing its use.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">No accuracy guarantee</h2>
        <p className="mt-2">
          AI-generated answers, exam analyses, mock exams, and study plans can be wrong. Nothing in Exam Mode or
          elsewhere is a guarantee of what will actually appear on a real exam — treat every output as a starting
          point to check, not a final answer.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Free-use allowance</h2>
        <p className="mt-2">
          Each account gets a monthly allowance of AI usage (25,000 input tokens and 25,000 output tokens). This resets
          each calendar month. It exists to keep the service sustainable — it isn&apos;t a guarantee of unlimited use.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Acceptable use</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Don&apos;t upload content you don&apos;t have the right to share (e.g. someone else&apos;s private material without permission).</li>
          <li>Don&apos;t try to abuse, automate, or resell access to the service.</li>
          <li>Don&apos;t attempt to use the app to generate harmful, illegal, or academically dishonest content beyond ordinary study help.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Your content</h2>
        <p className="mt-2">
          You keep ownership of what you upload. You&apos;re responsible for making sure you have the right to submit it
          for AI processing (see the <Link href="/privacy" className="underline">Privacy Policy</Link> for how that
          processing works).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Availability</h2>
        <p className="mt-2">
          This is provided as-is, without uptime or accuracy guarantees. Features, models, and the free-use allowance
          may change.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Changes</h2>
        <p className="mt-2">Continued use after a change to these terms means you accept the update.</p>
      </section>

      <Link href="/login" className="text-sm text-zinc-500 underline">
        ← Back to sign in
      </Link>
    </main>
  );
}
