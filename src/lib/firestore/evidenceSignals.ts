import { addDoc, collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { computeTopicState } from "@/lib/evidenceEngine";
import type { EvidenceSignalDoc, TopicStateDoc } from "@/lib/firestore/types";

function evidenceSignalsRef(uid: string) {
  return collection(db, "users", uid, "evidenceSignals");
}

function topicStatesRef(uid: string) {
  return collection(db, "users", uid, "topicStates");
}

function topicGenerationsRef(uid: string) {
  return collection(db, "users", uid, "topicGenerations");
}

function topicStateDocId(classId: string, topicId: string) {
  return `${classId}__${topicId}`;
}

// Caps how many of a topic's most recent signals feed the recompute — bounds
// both the write (evidenceIds sits well under Firestore's 1MiB doc limit)
// and the arithmetic cost. Recency-decays to near zero anyway past a few
// half-lives, so dropping older signals barely moves the scores. This still
// reads every signal for the topic before sorting/slicing client-side rather
// than an indexed, limited query — this app deliberately has no
// firestore.indexes.json/index-deployment step, so every query here sorts
// client-side instead of relying on a composite index that isn't provisioned.
// Bounding the *read* itself would need that index; left as a P1 item.
const MAX_SIGNALS_PER_TOPIC = 200;

export async function recordEvidenceSignals(uid: string, signals: Omit<EvidenceSignalDoc, "id">[]): Promise<void> {
  if (signals.length === 0) return;
  await Promise.all(signals.map((s) => addDoc(evidenceSignalsRef(uid), s)));
}

export async function listEvidenceSignalsForTopic(uid: string, classId: string, topicId: string): Promise<EvidenceSignalDoc[]> {
  const snap = await getDocs(query(evidenceSignalsRef(uid), where("classId", "==", classId), where("topicId", "==", topicId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<EvidenceSignalDoc, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_SIGNALS_PER_TOPIC);
}

export async function listTopicStates(uid: string, classId: string): Promise<TopicStateDoc[]> {
  const snap = await getDocs(query(topicStatesRef(uid), where("classId", "==", classId)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TopicStateDoc, "id">) })).sort((a, b) => b.tps - a.tps);
}

/**
 * Claims the next generation number for (classId, topicId): a per-topic
 * counter bumped inside a transaction on one small document. Concurrent
 * callers racing this same transaction are strictly, unambiguously ordered
 * by Firestore's serialized commits on that document — unlike the signal
 * content itself (createdAt, evidenceIds), which two independent recomputes
 * for the same topic can legitimately tie on (every signal from one chat
 * turn shares a single batch timestamp, and the read window is capped to
 * MAX_SIGNALS_PER_TOPIC, so neither a timestamp nor a count comparison can
 * be made airtight against every interleaving). A plain incrementing counter
 * sidesteps that whole class of tie case entirely: no two calls ever get the
 * same number.
 */
async function claimNextGeneration(uid: string, classId: string, topicId: string): Promise<number> {
  const ref = doc(topicGenerationsRef(uid), topicStateDocId(classId, topicId));
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = ((snap.data()?.generation as number | undefined) ?? 0) + 1;
    tx.set(ref, { generation: next }, { merge: true });
    return next;
  });
}

/**
 * Reads every evidence signal recorded for (classId, topicId) so far and
 * recomputes that topic's state from scratch — a plain overwrite, not a
 * merge, since every score is a deterministic function of the full signal
 * set, not an incremental update.
 *
 * The signal read below isn't inside a transaction (Firestore transactions
 * can't contain a `where`-query read), so two concurrent recomputes for the
 * same topic (e.g. two tabs replying at once) can each read a snapshot and
 * race to write. This first claims a strictly-ordered generation number (see
 * claimNextGeneration above), then guards the topicState write with it: the
 * transaction skips the write if the currently-stored state already carries
 * a generation at least as high as this one, so a call that lost the
 * generation race can never clobber one that won it — regardless of which
 * signals either call happened to see.
 */
export async function recomputeTopicState(uid: string, classId: string, topicId: string, topicLabel: string): Promise<void> {
  const myGeneration = await claimNextGeneration(uid, classId, topicId);
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
    generation: myGeneration,
  };
  const ref = doc(topicStatesRef(uid), topicStateDocId(classId, topicId));
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) {
      const existingGeneration = (existing.data() as TopicStateDoc).generation ?? 0;
      if (existingGeneration >= myGeneration) return;
    }
    tx.set(ref, data);
  });
}
