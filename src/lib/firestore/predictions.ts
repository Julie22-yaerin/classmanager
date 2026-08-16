import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PredictionDoc, PredictionStatus } from "@/lib/firestore/types";

function predictionsRef(uid: string) {
  return collection(db, "users", uid, "predictions");
}

function predictionRef(uid: string, id: string) {
  return doc(db, "users", uid, "predictions", id);
}

export async function listPredictions(uid: string): Promise<PredictionDoc[]> {
  const snap = await getDocs(predictionsRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PredictionDoc, "id">) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordPredictions(uid: string, predictions: Omit<PredictionDoc, "id">[]): Promise<void> {
  if (predictions.length === 0) return;
  await Promise.all(predictions.map((p) => addDoc(predictionsRef(uid), p)));
}

export async function resolvePrediction(
  uid: string,
  id: string,
  status: Exclude<PredictionStatus, "pending">,
  resolutionNote: string | null = null,
): Promise<void> {
  await updateDoc(predictionRef(uid, id), { status, resolutionNote, resolvedAt: new Date().toISOString() });
}
