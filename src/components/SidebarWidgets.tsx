"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { listDeadlines } from "@/lib/firestore/deadlines";
import { listPredictions } from "@/lib/firestore/predictions";
import { SOURCE_LABEL } from "@/components/predictions/PredictionRow";
import LocalCalendar from "@/components/deadlines/LocalCalendar";
import type { DeadlineDoc, PredictionDoc } from "@/lib/firestore/types";

const CONFIDENCE_RANK: Record<PredictionDoc["confidence"], number> = { high: 3, medium: 2, low: 1 };
const CONFIDENCE_PERCENT: Record<PredictionDoc["confidence"], number> = { high: 90, medium: 60, low: 30 };

function topPending(predictions: PredictionDoc[]): PredictionDoc | null {
  const pending = predictions.filter((p) => p.status === "pending");
  if (pending.length === 0) return null;
  return pending.reduce((best, p) => {
    if (CONFIDENCE_RANK[p.confidence] !== CONFIDENCE_RANK[best.confidence]) {
      return CONFIDENCE_RANK[p.confidence] > CONFIDENCE_RANK[best.confidence] ? p : best;
    }
    return p.createdAt > best.createdAt ? p : best;
  });
}

// Condensed calendar + top-prediction widgets, always visible in the
// sidebar (not just the chat home screen) — same data as
// DeadlineCalendarWidget/TopPredictionWidget, sized for a 256px rail.
export default function SidebarWidgets() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<DeadlineDoc[]>([]);
  const [topPrediction, setTopPrediction] = useState<PredictionDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [d, p] = await Promise.all([listDeadlines(user.uid), listPredictions(user.uid)]);
      if (!active) return;
      setDeadlines(d);
      setTopPrediction(topPending(p));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return null;

  return (
    <div className="flex flex-col gap-3 px-2">
      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-zinc-500">Calendar</h2>
          <Link href="/deadlines" className="text-[11px] text-zinc-400 hover:text-zinc-700 hover:underline dark:hover:text-zinc-200">
            View all
          </Link>
        </div>
        <LocalCalendar deadlines={deadlines} compact />
      </div>

      <Link
        href="/predictions"
        className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <h2 className="text-xs font-medium text-zinc-500">Top prediction</h2>
        {topPrediction ? (
          <div className="mt-1.5 flex items-center gap-2">
            <p className="shrink-0 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {CONFIDENCE_PERCENT[topPrediction.confidence]}%
            </p>
            <div className="min-w-0">
              <p className="line-clamp-2 text-xs text-zinc-800 dark:text-zinc-200">{topPrediction.claim}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">{SOURCE_LABEL[topPrediction.source]}</p>
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-500">Nothing pending yet.</p>
        )}
      </Link>
    </div>
  );
}
