"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { listDeadlines } from "@/lib/firestore/deadlines";
import { connectGoogleCalendar, getValidCalendarToken } from "@/lib/googleCalendar";
import DeadlineRow from "@/components/deadlines/DeadlineRow";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { DeadlineDoc } from "@/lib/firestore/types";

export default function DeadlinesPage() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<DeadlineDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setDeadlines(await listDeadlines(user.uid));
      setCalendarConnected(!!getValidCalendarToken());
      setLoading(false);
    })();
  }, [user]);

  async function handleConnect() {
    setConnecting(true);
    try {
      await connectGoogleCalendar();
      setCalendarConnected(true);
    } catch {
      // Non-critical — the banner just stays up so they can retry.
    } finally {
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const open = deadlines.filter((d) => !d.done);
  const done = deadlines.filter((d) => d.done);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Deadlines</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Extracted automatically from Teacher Announcements and Class Recordings across every class.
      </p>

      {!calendarConnected && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-zinc-600 dark:text-zinc-300">Not synced to a calendar yet.</span>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {connecting ? "Connecting…" : "Connect Google Calendar"}
          </button>
        </div>
      )}
      {calendarConnected && (
        <p className="mt-4 text-xs text-zinc-500">
          ✓ Google Calendar connected for this session — auto-sync toggle is in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>
          .
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500">Open ({open.length})</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {open.map((d) => (
            <DeadlineRow key={d.id} deadline={d} />
          ))}
          {open.length === 0 && <li className="text-sm text-zinc-500">Nothing outstanding.</li>}
        </ul>
      </section>

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-zinc-500">Done ({done.length})</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {done.map((d) => (
              <DeadlineRow key={d.id} deadline={d} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
