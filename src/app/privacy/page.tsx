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
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Who&apos;s responsible for this data</h2>
        <p className="mt-2">
          School AI is operated by the app operator, contactable at{" "}
          <a href="mailto:yris22@thelyceum.site" className="underline">
            yris22@thelyceum.site
          </a>{" "}
          for any privacy question, data request, or concern — this is the data controller for anything described on
          this page.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Age &amp; parental consent</h2>
        <p className="mt-2">
          School AI is built for students, including those under 18. Creating an account requires confirming you&apos;re
          16 or older, or that a parent/guardian created the account and consents to your use of it — that
          confirmation happens at sign-up. If you&apos;re a parent or guardian and believe a child under 16 created an
          account without your consent, contact{" "}
          <a href="mailto:yris22@thelyceum.site" className="underline">
            yris22@thelyceum.site
          </a>{" "}
          and the account and its data will be deleted.
        </p>
      </section>

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
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Why we&apos;re allowed to process this</h2>
        <p className="mt-2">
          Account info and the content you submit are processed to perform the service you&apos;ve asked for — that&apos;s
          the contractual basis for using School AI. Usage tracking (token counts) is processed under our legitimate
          interest in keeping the free-use allowance fair and the service financially sustainable. Analytics cookies
          run only with your consent (see the cookie banner and the toggle in Settings).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Where it&apos;s stored</h2>
        <p className="mt-2">
          Everything above is stored in Google Firestore, scoped to your account — Firestore&apos;s security rules
          prevent any other user, and this app&apos;s own server, from reading or writing your data directly; access is
          only ever your signed-in browser acting on your own account. Data is transmitted over encrypted (HTTPS/TLS)
          connections end to end — from your browser to Firebase/Firestore, to our servers, and to the AI providers
          below.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">How long we keep it</h2>
        <p className="mt-2">
          Your data is kept for as long as your account exists, so class memory and history stay useful across the
          school year. Deleting your account (Settings → Account → Delete account) permanently deletes it immediately
          — there&apos;s no separate retention period afterward, other than what a third-party processor below
          independently retains under its own policy (e.g. transient inference logs at an AI provider).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">International transfers</h2>
        <p className="mt-2">
          Firebase/Firestore (Google) and the AI providers below may process and store data outside your own country —
          that&apos;s inherent to using global cloud infrastructure. These providers are large-scale processors that
          maintain their own cross-border transfer safeguards (e.g. standard contractual clauses); we don&apos;t
          separately re-host or restrict where they run.
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
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Your rights</h2>
        <p className="mt-2">You can, at any time and mostly without asking us:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Access &amp; export</strong> — Settings → Privacy &amp; data → Download my data gives you
            everything we hold on you as a JSON file.
          </li>
          <li>
            <strong>Rectify</strong> — edit or delete any teacher, class, or material directly in the app; your
            profile is editable in Settings.
          </li>
          <li>
            <strong>Erase</strong> — Settings → Account → Delete account permanently removes your account and every
            record tied to it, immediately.
          </li>
          <li>
            <strong>Object / withdraw consent</strong> — turn off audio-upload processing or analytics consent
            anytime in Settings → Privacy &amp; data.
          </li>
          <li>
            <strong>Complain</strong> — if you&apos;re in the EU/EEA, UK, or another jurisdiction with a data
            protection authority, you can lodge a complaint with your local authority. We&apos;d appreciate the chance
            to fix it first at{" "}
            <a href="mailto:yris22@thelyceum.site" className="underline">
              yris22@thelyceum.site
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Security measures</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>All connections use HTTPS/TLS, with HSTS enforced.</li>
          <li>Every record is scoped to your account by Firestore Security Rules — enforced server-side, not just in the app.</li>
          <li>Authentication uses Firebase Auth; we never see or store your password.</li>
          <li>Rate limiting and request-size limits guard every AI endpoint against abuse.</li>
        </ul>
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
