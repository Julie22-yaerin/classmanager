"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listTopicStates } from "@/lib/firestore/evidenceSignals";
import { dominantComponent } from "@/lib/evidenceEngine";
import PriorityPyramid from "@/components/class/PriorityPyramid";
import type { TopicStateDoc, TpsTier, ConfidenceTier } from "@/lib/firestore/types";

const VIEWS = ["map", "forecast", "move"] as const;
type View = (typeof VIEWS)[number];

const VIEW_LABEL: Record<View, string> = { map: "Map", forecast: "Forecast", move: "Move" };

const TIER_STYLE: Record<TpsTier, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  High: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Medium: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Low: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Minimal: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500",
};

const CONFIDENCE_STYLE: Record<ConfidenceTier, string> = {
  "Very Strong": "text-emerald-700 dark:text-emerald-400",
  Strong: "text-emerald-600 dark:text-emerald-500",
  Moderate: "text-amber-600 dark:text-amber-400",
  Weak: "text-zinc-500 dark:text-zinc-400",
  Insufficient: "text-zinc-400 dark:text-zinc-500",
};

function TierBadge({ tier }: { tier: TpsTier }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIER_STYLE[tier]}`}>{tier}</span>;
}

export default function IntelligencePanel({ classId }: { classId: string }) {
  const { user } = useAuth();
  const [states, setStates] = useState<TopicStateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("map");

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listTopicStates(user.uid, classId);
        if (!active) return;
        setStates(result);
      } catch {
        if (!active) return;
        setError("Could not load topic intelligence — try again later.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, classId]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (states.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No evidence yet. As you chat about this class — homework, exams, teacher announcements — topic evidence is captured automatically and
        scored here.
      </section>
    );
  }

  const forecastSorted = [...states].sort((a, b) => b.pExam - a.pExam);
  const moveSorted = [...states]
    .map((s) => ({ state: s, actionValue: (s.tps / 100) * s.pExam }))
    .sort((a, b) => b.actionValue - a.actionValue)
    .slice(0, 3);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Intelligence</h2>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-600">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                view === v ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-transparent text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {view === "map" && (
        <>
          <PriorityPyramid states={states} />
          <ul className="mt-2 flex flex-col gap-3">
            {states.map((s) => (
              <li key={s.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{s.topicLabel}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{s.tps}</span>
                    <TierBadge tier={s.tpsTier} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {s.signalCount} evidence signal{s.signalCount === 1 ? "" : "s"} · driven mainly by {dominantComponent(s)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === "forecast" && (
        <>
          <ul className="mt-4 flex flex-col gap-3">
            {forecastSorted.map((s) => (
              <li key={s.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{s.topicLabel}</span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{Math.round(s.pExam * 100)}%</span>
                </div>
                <p className={`mt-1 text-xs font-medium ${CONFIDENCE_STYLE[s.confidenceTier]}`}>{s.confidenceTier} confidence</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-400">
            These percentages come from a fixed starting model, not yet calibrated against real outcomes — treat them as directional, not exact.
          </p>
        </>
      )}

      {view === "move" && (
        <ul className="mt-4 flex flex-col gap-3">
          {moveSorted.map(({ state: s }, i) => (
            <li key={s.id} className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-900 text-xs font-medium text-white dark:bg-amber-200 dark:text-amber-950">
                  {i + 1}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{s.topicLabel}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {Math.round(s.pExam * 100)}% exam likelihood, driven mainly by {dominantComponent(s)}.
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
