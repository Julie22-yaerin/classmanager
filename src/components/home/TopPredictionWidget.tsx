"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { listPredictions } from "@/lib/firestore/predictions";
import { SOURCE_LABEL } from "@/components/predictions/PredictionRow";
import type { PredictionDoc } from "@/lib/firestore/types";

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

export default function TopPredictionWidget() {
  const { user } = useAuth();
  const [top, setTop] = useState<PredictionDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const predictions = await listPredictions(user.uid);
      setTop(topPending(predictions));
      setLoading(false);
    })();
  }, [user]);

  return (
    <Link
      href="/predictions"
      className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <h2 className="text-sm font-medium text-zinc-500">Top prediction</h2>
      {loading ? (
        <p className="mt-3 text-sm text-zinc-400">Loading…</p>
      ) : top ? (
        <div className="mt-2 flex items-start gap-3">
          <p className="shrink-0 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{CONFIDENCE_PERCENT[top.confidence]}%</p>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm text-zinc-800 dark:text-zinc-200">{top.claim}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {top.className} · {SOURCE_LABEL[top.source]}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Nothing pending yet — Exam Mode, Teacher Simulator, and Pattern Finder will start logging predictions here.</p>
      )}
    </Link>
  );
}
