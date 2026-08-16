"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listRecentClassUpdates } from "@/lib/firestore/classUpdates";
import type { ClassUpdateDoc } from "@/lib/firestore/types";

const LEVEL_LABEL: Record<string, string> = { low: "LOW", medium: "MEDIUM", high: "HIGH", new: "NEW" };

export default function WhatChangedPanel({ classId }: { classId: string }) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<ClassUpdateDoc[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setUpdates(await listRecentClassUpdates(user.uid, classId, 5));
      setLoaded(true);
    })();
  }, [user, classId]);

  if (!loaded || updates.length === 0) return null;

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
      <h2 className="text-sm font-medium text-amber-900 dark:text-amber-200">What changed</h2>
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {updates.map((u) => (
          <li key={u.id}>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{u.topic}</span>{" "}
            <span className="text-xs font-medium tracking-wide text-zinc-500">
              {LEVEL_LABEL[u.fromLevel]} → {LEVEL_LABEL[u.toLevel]}
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">{u.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
