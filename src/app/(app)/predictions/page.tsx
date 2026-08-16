"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listPredictions, resolvePrediction } from "@/lib/firestore/predictions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { EvidenceBadge } from "@/components/class/WeightBars";
import type { PredictionDoc, PredictionStatus } from "@/lib/firestore/types";

const SOURCE_LABEL: Record<PredictionDoc["source"], string> = {
  examMode: "Exam Mode",
  teacherSimulator: "Teacher Simulator",
  patternFinder: "Pattern Finder",
};

const CONFIDENCE_LABEL = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" } as const;

const STATUS_LABEL: Record<Exclude<PredictionStatus, "pending">, string> = {
  correct: "Correct",
  partial: "Partially right",
  incorrect: "Wrong",
};

const STATUS_STYLE: Record<Exclude<PredictionStatus, "pending">, string> = {
  correct: "text-emerald-700 dark:text-emerald-400",
  partial: "text-amber-700 dark:text-amber-400",
  incorrect: "text-zinc-500 dark:text-zinc-400",
};

function computeAccuracy(predictions: PredictionDoc[]): { resolvedCount: number; accuracy: number | null } {
  const resolved = predictions.filter((p) => p.status !== "pending");
  if (resolved.length === 0) return { resolvedCount: 0, accuracy: null };
  const score = resolved.reduce((sum, p) => sum + (p.status === "correct" ? 1 : p.status === "partial" ? 0.5 : 0), 0);
  return { resolvedCount: resolved.length, accuracy: Math.round((score / resolved.length) * 100) };
}

function PredictionRow({ prediction, onResolve }: { prediction: PredictionDoc; onResolve: (id: string, status: Exclude<PredictionStatus, "pending">) => void }) {
  return (
    <li className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-zinc-900 dark:text-zinc-50">{prediction.claim}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {prediction.className} · {SOURCE_LABEL[prediction.source]}
          </p>
        </div>
        <div className="shrink-0">
          <EvidenceBadge level={prediction.confidence} labels={CONFIDENCE_LABEL} />
        </div>
      </div>
      {prediction.status === "pending" ? (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onResolve(prediction.id, "correct")}
            className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          >
            Correct
          </button>
          <button
            onClick={() => onResolve(prediction.id, "partial")}
            className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          >
            Partially right
          </button>
          <button
            onClick={() => onResolve(prediction.id, "incorrect")}
            className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Wrong
          </button>
        </div>
      ) : (
        <p className={`mt-2 text-xs font-medium uppercase tracking-wide ${STATUS_STYLE[prediction.status]}`}>{STATUS_LABEL[prediction.status]}</p>
      )}
    </li>
  );
}

export default function PredictionsPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setPredictions(await listPredictions(user.uid));
      setLoading(false);
    })();
  }, [user]);

  async function handleResolve(id: string, status: Exclude<PredictionStatus, "pending">) {
    if (!user) return;
    await resolvePrediction(user.uid, id, status);
    setPredictions((prev) => prev.map((p) => (p.id === id ? { ...p, status, resolvedAt: new Date().toISOString() } : p)));
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const pending = predictions.filter((p) => p.status === "pending");
  const resolved = predictions.filter((p) => p.status !== "pending");
  const { resolvedCount, accuracy } = computeAccuracy(predictions);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Prediction Ledger</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every confident claim Exam Mode, Teacher Simulator, and Pattern Finder make, logged so you can check whether they actually held up.
      </p>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{accuracy === null ? "—" : `${accuracy}%`}</p>
            <p className="text-xs text-zinc-500">Accuracy across {resolvedCount} resolved prediction{resolvedCount === 1 ? "" : "s"}</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{pending.length}</p>
            <p className="text-xs text-zinc-500">Awaiting resolution</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500">Awaiting resolution ({pending.length})</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {pending.map((p) => (
            <PredictionRow key={p.id} prediction={p} onResolve={handleResolve} />
          ))}
          {pending.length === 0 && <li className="text-sm text-zinc-500">Nothing pending — generate an Exam Mode report, Teacher Simulator, or Pattern Finder to log new predictions.</li>}
        </ul>
      </section>

      {resolved.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-zinc-500">Resolved ({resolved.length})</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {resolved.map((p) => (
              <PredictionRow key={p.id} prediction={p} onResolve={handleResolve} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
