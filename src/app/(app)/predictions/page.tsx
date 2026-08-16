"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listPredictions, resolvePrediction } from "@/lib/firestore/predictions";
import { computeAccuracy, computeCalibration } from "@/lib/predictionStats";
import LoadingSpinner from "@/components/LoadingSpinner";
import PredictionRow, { SOURCE_LABEL } from "@/components/predictions/PredictionRow";
import type { PredictionDoc, PredictionSource, PredictionStatus } from "@/lib/firestore/types";

const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
const SOURCES: PredictionSource[] = ["examMode", "teacherSimulator", "patternFinder"];

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
  const { byConfidence, bySource } = computeCalibration(predictions);

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

      {resolvedCount > 0 && (
        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium">Is high confidence actually more accurate?</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Accuracy by confidence level, across resolved predictions.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {CONFIDENCE_LEVELS.map((level) => (
              <div key={level} className="rounded-md bg-zinc-50 p-2.5 text-center dark:bg-zinc-950">
                <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {byConfidence[level].accuracy === null ? "—" : `${byConfidence[level].accuracy}%`}
                </p>
                <p className="text-xs capitalize text-zinc-500">{level} ({byConfidence[level].resolvedCount})</p>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pb-1 pr-2 font-medium">Feature</th>
                  {CONFIDENCE_LEVELS.map((level) => (
                    <th key={level} className="pb-1 pr-2 text-right font-medium capitalize">
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((source) => (
                  <tr key={source} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1.5 pr-2 text-zinc-700 dark:text-zinc-300">{SOURCE_LABEL[source]}</td>
                    {CONFIDENCE_LEVELS.map((level) => {
                      const bucket = bySource[source][level];
                      return (
                        <td key={level} className="py-1.5 pr-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                          {bucket.accuracy === null ? "—" : `${bucket.accuracy}% (${bucket.resolvedCount})`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
