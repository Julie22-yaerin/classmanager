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
 * Reads every evidence signal recorded for (classId, topicId) so far and
 * recomputes that topic's state from scratch — a plain overwrite, not a
 * merge, since every score is a deterministic function of the full signal
 * set, not an incremental update.
 *
 * The signal read above isn't inside a transaction (Firestore transactions
 * can't contain a `where`-query read), so two concurrent recomputes for the
 * same topic (e.g. two tabs replying at once) can each read a snapshot and
 * race to write. The transaction below guards the write itself using each
 * computation's (newestSignalAt, signal count) as a composite ordering key —
 * NOT evidenceIds containment: the read above is capped to the
 * MAX_SIGNALS_PER_TOPIC most recent signals, a sliding window, so a later
 * computation is not guaranteed to be a superset of an earlier one (older ids
 * can fall out of the window while the newer computation is still in
 * flight). newestSignalAt alone isn't enough either: every signal recorded
 * from the same chat turn shares one batch timestamp (see `evidenceNow` in
 * app/page.tsx), so two concurrent turns for the same topic can tie on it
 * while covering different signals. Breaking that tie by signal count is
 * sound because evidence is append-only: whichever computation's read landed
 * after both turns' writes committed necessarily saw a strictly larger set,
 * so a higher count is never a regression. (An exact tie on both
 * newestSignalAt *and* count from genuinely disjoint concurrent turns would
 * require two independent chat completions to land the same number of new
 * signals on the same topic within the same millisecond — accepted as an
 * unreachable-in-practice edge case for this P0 slice.)
 */
export async function recomputeTopicState(uid: string, classId: string, topicId: string, topicLabel: string): Promise<void> {
  const signals = await listEvidenceSignalsForTopic(uid, classId, topicId);
  if (signals.length === 0) return;
  const computed = computeTopicState(signals);
  const evidenceIds = signals.map((s) => s.id);
  // signals is sorted newest-first by listEvidenceSignalsForTopic.
  const newestSignalAt = signals[0].createdAt;
  const data: Omit<TopicStateDoc, "id"> = {
    classId,
    topicId,
    topicLabel,
    ...computed,
    evidenceIds,
    lastComputedAt: new Date().toISOString(),
    newestSignalAt,
  };
  const ref = doc(topicStatesRef(uid), topicStateDocId(classId, topicId));
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) {
      const existingData = existing.data() as TopicStateDoc;
      const existingNewestSignalAt = existingData.newestSignalAt;
      const existingCount = existingData.evidenceIds?.length ?? 0;
      const isStale =
        !!existingNewestSignalAt &&
        (existingNewestSignalAt > newestSignalAt || (existingNewestSignalAt === newestSignalAt && existingCount >= evidenceIds.length));
      if (isStale) return;
    }
    tx.set(ref, data);
  });
}
