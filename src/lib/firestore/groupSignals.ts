import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore/profile";
import type { ClassDoc, GroupContributionDoc, GroupContributionRefDoc, GroupSignalDoc } from "@/lib/firestore/types";
import type { TopicPriorityItem } from "@/lib/types";

const TITLE_PREFIX = /^(mr|mrs|ms|miss|dr|prof)\.?\s+/;

// Best-effort match key for "probably the same real class" across
// independent student accounts: normalized teacher name + subject + grade.
// This is approximate, not verified — two different teachers who happen to
// share a name, subject, and grade would incorrectly merge. Surfaced as a
// caveat in the UI rather than hidden.
export function classFingerprint(teacherName: string, subject: string, grade: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(TITLE_PREFIX, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return [norm(teacherName), norm(subject), norm(grade)].filter(Boolean).join("__") || "unknown";
}

function signalDocRef(fingerprint: string) {
  return doc(db, "groupSignals", fingerprint);
}

function contributionRef(fingerprint: string, uid: string) {
  return doc(db, "groupSignals", fingerprint, "contributions", uid);
}

function contributionRefMarkerRef(uid: string, fingerprint: string) {
  return doc(db, "users", uid, "groupContributionRefs", fingerprint);
}

// No-ops if the user hasn't opted in. Reads their profile fresh each call
// (topic priorities change infrequently) rather than threading opt-in state
// through every caller.
export async function contributeGroupSignal(uid: string, cls: ClassDoc, topicPriorities: TopicPriorityItem[]): Promise<void> {
  if (topicPriorities.length === 0) return;
  const profile = await getUserProfile(uid);
  if (!profile?.shareGroupIntelligence) return;

  const fingerprint = classFingerprint(cls.teacherName, cls.subject, cls.grade);
  const now = new Date().toISOString();

  const signal: GroupSignalDoc = { fingerprint, teacherName: cls.teacherName, subject: cls.subject, grade: cls.grade, createdAt: now };
  await setDoc(signalDocRef(fingerprint), signal, { merge: true });

  const contribution: GroupContributionDoc = {
    topicWeights: topicPriorities.map((t) => ({ topic: t.topic, weight: t.weight })),
    contributedAt: now,
  };
  await setDoc(contributionRef(fingerprint, uid), contribution);

  const ref: Omit<GroupContributionRefDoc, "id"> = { fingerprint, updatedAt: now };
  await setDoc(contributionRefMarkerRef(uid, fingerprint), ref);
}

export async function getGroupSignal(fingerprint: string): Promise<{ signal: GroupSignalDoc; contributions: GroupContributionDoc[] } | null> {
  const signalSnap = await getDoc(signalDocRef(fingerprint));
  if (!signalSnap.exists()) return null;
  const contribSnap = await getDocs(collection(db, "groupSignals", fingerprint, "contributions"));
  return {
    signal: signalSnap.data() as GroupSignalDoc,
    contributions: contribSnap.docs.map((d) => d.data() as GroupContributionDoc),
  };
}

export async function listContributionRefs(uid: string): Promise<GroupContributionRefDoc[]> {
  const snap = await getDocs(collection(db, "users", uid, "groupContributionRefs"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GroupContributionRefDoc, "id">) }));
}

// Removes this user's contribution from every fingerprint they've shared to,
// and the private markers tracking them — used on account deletion so
// opting out (or deleting the account) actually removes shared data, not
// just the user's own private tree.
export async function deleteAllGroupContributions(uid: string): Promise<void> {
  const refs = await listContributionRefs(uid);
  await Promise.all(refs.map((r) => deleteDoc(contributionRef(r.fingerprint, uid))));
  await Promise.all(refs.map((r) => deleteDoc(contributionRefMarkerRef(uid, r.fingerprint))));
}
