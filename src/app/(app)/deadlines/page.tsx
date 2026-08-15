"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listDeadlines } from "@/lib/firestore/deadlines";
import DeadlineRow from "@/components/deadlines/DeadlineRow";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { DeadlineDoc } from "@/lib/firestore/types";

export default function DeadlinesPage() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<DeadlineDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setDeadlines(await listDeadlines(user.uid));
      setLoading(false);
    })();
  }, [user]);

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
