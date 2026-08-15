"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listClasses } from "@/lib/firestore/classes";
import { listDeadlines } from "@/lib/firestore/deadlines";
import { listRecentMaterialsByTag } from "@/lib/firestore/materials";
import { getUserProfile } from "@/lib/firestore/profile";
import { callApi } from "@/lib/apiClient";
import { toProfileContext } from "@/lib/mappers";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { DailyInputItem, DailyPlanOutput, DailyPlanItem } from "@/lib/dailyMode";

function Bucket({ title, items, tone }: { title: string; items: DailyPlanItem[]; tone: "must" | "should" | "ignore" }) {
  const toneClasses = {
    must: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950",
    should: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
    ignore: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
  }[tone];

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</h2>
      <div className="mt-2 flex flex-col gap-2">
        {items.length === 0 && <p className="text-sm text-zinc-400 italic">Nothing here.</p>}
        {items.map((item, i) => (
          <div key={i} className={`rounded-xl border px-4 py-3 text-sm ${toneClasses}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.title}</span>
              <span className="shrink-0 text-xs text-zinc-500">~{item.estimated_minutes} min</span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{item.className}</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DailyPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<DailyPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasNothing, setHasNothing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [classes, deadlines, homework] = await Promise.all([
        listClasses(user.uid),
        listDeadlines(user.uid),
        listRecentMaterialsByTag(user.uid, "Homework", 15),
      ]);
      const classesById = new Map(classes.map((c) => [c.id, c]));

      const items: DailyInputItem[] = [
        ...deadlines
          .filter((d) => !d.done)
          .map((d) => ({
            id: d.id,
            kind: "deadline" as const,
            title: d.title,
            className: d.className,
            teacherName: d.teacherName,
            dueDate: d.dueDate,
            notes: d.notes,
          })),
        ...homework.map((m) => {
          const cls = classesById.get(m.classId);
          return {
            id: m.id,
            kind: "homework" as const,
            title: m.topic ?? (m.rawContent ? m.rawContent.slice(0, 60) : "Homework"),
            className: cls?.subject ?? m.className,
            teacherName: cls?.teacherName ?? "",
            dueDate: null,
            notes: null,
          };
        }),
      ];

      setLoading(false);
      if (items.length === 0) {
        setHasNothing(true);
        return;
      }

      setGenerating(true);
      try {
        const profile = await getUserProfile(user.uid);
        const { plan } = await callApi<{ plan: DailyPlanOutput }>("/api/daily-mode", { items, profile: toProfileContext(profile) });
        setPlan(plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to build today's plan");
      } finally {
        setGenerating(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Daily Mode</h1>
      <p className="mt-1 text-sm text-zinc-500">What do you actually need to do today?</p>

      {hasNothing && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nothing outstanding right now — no deadlines and no recent homework.
        </div>
      )}

      {generating && <p className="mt-6 text-sm text-zinc-500">Triaging today&apos;s work…</p>}

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {plan && (
        <div className="mt-6 flex flex-col gap-6">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{plan.summary}</p>
          <Bucket title="Must" items={plan.must} tone="must" />
          <Bucket title="Should" items={plan.should} tone="should" />
          <Bucket title="Can Ignore" items={plan.can_ignore} tone="ignore" />
        </div>
      )}
    </main>
  );
}
