import { addDoc, collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { computeTopicState } from "@/lib/evidenceEngine";
import type { EvidenceSignalDoc, TopicStateDoc } from "@/lib/firestore/types";

function evidenceSignalsRef(uid: string) {
  return collection(db, "users", uid, "evidenceSignals");
}

function topicStatesRef(uid: string) {
  return collection(db, "users", uid, "topicStates");
}

function topicStateDocId(classId: string, topicId: string) {
  return `${classId}__${topicId}`;
}

export async function recordEvidenceSignals(uid: string, signals: Omit<EvidenceSignalDoc, "id">[]): Promise<void> {
  if (signals.length === 0) return;
  await Promise.all(signals.map((s) => addDoc(evidenceSignalsRef(uid), s)));
}

export async function listEvidenceSignalsForTopic(uid: string, classId: string, topicId: string): Promise<EvidenceSignalDoc[]> {
  const snap = await getDocs(query(evidenceSignalsRef(uid), where("classId", "==", classId), where("topicId", "==", topicId)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EvidenceSignalDoc, "id">) }));
}

export async function listTopicStates(uid: string, classId: string): Promise<TopicStateDoc[]> {
  const snap = await getDocs(query(topicStatesRef(uid), where("classId", "==", classId)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TopicStateDoc, "id">) })).sort((a, b) => b.tps - a.tps);
}

/**
 * Reads every evidence signal recorded for (classId, topicId) so far and
 * recomputes that topic's state from scratch — a plain overwrite, not a
 * merge, since every score is a deterministic function of the full signal
 * set, not an incremental update.
 */
export async function recomputeTopicState(uid: string, classId: string, topicId: string, topicLabel: string): Promise<void> {
  const signals = await listEvidenceSignalsForTopic(uid, classId, topicId);
  if (signals.length === 0) return;
  const computed = computeTopicState(signals);
  const data: Omit<TopicStateDoc, "id"> = {
    classId,
    topicId,
    topicLabel,
    ...computed,
    evidenceIds: signals.map((s) => s.id),
    lastComputedAt: new Date().toISOString(),
  };
  await setDoc(doc(topicStatesRef(uid), topicStateDocId(classId, topicId)), data);
}
