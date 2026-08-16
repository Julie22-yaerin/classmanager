"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { listDeadlines } from "@/lib/firestore/deadlines";
import LocalCalendar from "@/components/deadlines/LocalCalendar";
import type { DeadlineDoc } from "@/lib/firestore/types";

export default function DeadlineCalendarWidget() {
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500">Deadlines</h2>
        <Link href="/deadlines" className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline dark:hover:text-zinc-200">
          View all
        </Link>
      </div>
      {loading ? <p className="mt-3 text-sm text-zinc-400">Loading…</p> : <LocalCalendar deadlines={deadlines} />}
    </div>
  );
}
