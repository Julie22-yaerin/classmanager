"use client";

import { EvidenceBadge } from "@/components/class/WeightBars";
import type { PredictionDoc, PredictionStatus } from "@/lib/firestore/types";

export const SOURCE_LABEL: Record<PredictionDoc["source"], string> = {
  examMode: "Exam Mode",
  teacherSimulator: "Teacher Simulator",
  patternFinder: "Pattern Finder",
};

export const CONFIDENCE_LABEL = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" } as const;

export const STATUS_LABEL: Record<Exclude<PredictionStatus, "pending">, string> = {
  correct: "Correct",
  partial: "Partially right",
  incorrect: "Wrong",
};

const STATUS_STYLE: Record<Exclude<PredictionStatus, "pending">, string> = {
  correct: "text-emerald-700 dark:text-emerald-400",
  partial: "text-amber-700 dark:text-amber-400",
  incorrect: "text-zinc-500 dark:text-zinc-400",
};

export default function PredictionRow({
  prediction,
  onResolve,
  readyToResolve,
}: {
  prediction: PredictionDoc;
  onResolve: (id: string, status: Exclude<PredictionStatus, "pending">) => void;
  readyToResolve?: boolean;
}) {
  return (
    <li className={`rounded-md border p-3 ${readyToResolve ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" : "border-zinc-200 dark:border-zinc-800"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-zinc-900 dark:text-zinc-50">{prediction.claim}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {prediction.className} · {SOURCE_LABEL[prediction.source]}
            {readyToResolve && <span className="ml-1 font-medium text-amber-700 dark:text-amber-400">· new material to check this against</span>}
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
