import type { Metadata } from "next";
import Link from "next/link";
import LaurelAvatar from "@/components/LaurelAvatar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What School AI collects, why, and how it's used.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <Link href="/" className="flex items-center gap-2 self-start">
        <LaurelAvatar size={28} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">School AI</span>
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Privacy Policy</h1>
        <p className="mt-1 text-xs text-zinc-500">Last updated: {new Date().toISOString().slice(0, 10)}</p>
      </div>

      <p>
        School AI is a study assistant: you tell it about your teachers and classes, send it homework, exam materials,
        recordings, and notes, and it helps you complete schoolwork and prepare for exams. This page explains what data
        that involves and how it&apos;s handled.
      </p>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">What we collect</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Account info</strong>: your email address, and if you sign in with Google, your name and Google
            account identifier — handled by Firebase Authentication.
          </li>
          <li>
            <strong>Content you provide</strong>: teachers and classes you create, homework/notes/announcements you send,
            and images, PDFs, or audio you attach.
          </li>
          <li>
            <strong>Derived data</strong>: what the AI learns from that content — class memory (curriculum, teaching
            style, topic priorities), a profile of your academic preferences, and generated study materials (exam
            reports, teacher playbooks).
          </li>
          <li>
            <strong>Usage</strong>: how many AI tokens you&apos;ve used this month, to enforce the free-use allowance.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Where it&apos;s stored</h2>
        <p className="mt-2">
          Everything above is stored in Google Firestore, scoped to your account — Firestore&apos;s security rules
          prevent any other user, and this app&apos;s own server, from reading or writing your data directly; access is
          only ever your signed-in browser acting on your own account.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Third parties involved in processing</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Firebase (Google)</strong> — authentication and data storage.
          </li>
          <li>
            <strong>OpenRouter</strong> and the underlying model providers it routes to (e.g. Anthropic, Google) — the
            text, images, PDFs, and audio you submit are sent to these providers to generate a response. We don&apos;t
            control their retention policies directly; consult OpenRouter&apos;s and the relevant model provider&apos;s
            own privacy terms for details on how they handle inference data.
          </li>
          <li>
            <strong>Google Analytics</strong> (optional) — only loaded if you accept the cookie banner. Declining means
            no analytics script runs for your visit.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">What we don&apos;t do</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>We don&apos;t sell your data.</li>
          <li>We don&apos;t show ads.</li>
          <li>We don&apos;t share your class content with other users — every account&apos;s data is isolated.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Your choices</h2>
        <p className="mt-2">
          You can edit or delete the teachers, classes, and materials you&apos;ve added at any time from within the app.
          To delete your account and all associated data, or for any other privacy question, contact the app operator
          through the channel this app was shared with you on.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Changes</h2>
        <p className="mt-2">
          If this policy changes materially, the &quot;last updated&quot; date above will change accordingly.
        </p>
      </section>

      <Link href="/login" className="text-sm text-zinc-500 underline">
        ← Back to sign in
      </Link>
    </main>
  );
}
