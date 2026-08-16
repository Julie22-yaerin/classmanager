"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listPredictionsForClass, resolvePrediction } from "@/lib/firestore/predictions";
import { computeAccuracy } from "@/lib/predictionStats";
import PredictionRow from "@/components/predictions/PredictionRow";
import type { MaterialDoc, PredictionDoc, PredictionStatus } from "@/lib/firestore/types";

// A pending prediction is "ready to resolve" once a past exam or class
// recording — the kind of material that could actually confirm or deny it —
// was added after the prediction was logged.
function isReadyToResolve(prediction: PredictionDoc, materials: MaterialDoc[]): boolean {
  return materials.some((m) => (m.tag === "PastExam" || m.tag === "ClassRecording") && m.createdAt > prediction.createdAt);
}

export default function ClassPredictionsPanel({ classId, materials }: { classId: string; materials: MaterialDoc[] }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictionDoc[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setPredictions(await listPredictionsForClass(user.uid, classId));
      setLoaded(true);
    })();
  }, [user, classId]);

  async function handleResolve(id: string, status: Exclude<PredictionStatus, "pending">) {
    if (!user) return;
    await resolvePrediction(user.uid, id, status);
    setPredictions((prev) => prev.map((p) => (p.id === id ? { ...p, status, resolvedAt: new Date().toISOString() } : p)));
  }

  if (!loaded || predictions.length === 0) return null;

  const pending = predictions.filter((p) => p.status === "pending");
  const readyIds = new Set(pending.filter((p) => isReadyToResolve(p, materials)).map((p) => p.id));
  const sortedPending = [...pending].sort((a, b) => (readyIds.has(a.id) === readyIds.has(b.id) ? 0 : readyIds.has(a.id) ? -1 : 1));
  const { resolvedCount, accuracy } = computeAccuracy(predictions);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Predictions for this class</h2>
        {resolvedCount > 0 && (
          <span className="text-xs text-zinc-500">
            {accuracy}% accurate over {resolvedCount} resolved
          </span>
        )}
      </div>
      {sortedPending.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {sortedPending.map((p) => (
            <PredictionRow key={p.id} prediction={p} onResolve={handleResolve} readyToResolve={readyIds.has(p.id)} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">No pending predictions for this class.</p>
      )}
    </section>
  );
}
