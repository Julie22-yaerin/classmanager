import { collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteAllGroupContributions } from "@/lib/firestore/groupSignals";

const SUBCOLLECTIONS = [
  "classes",
  "materials",
  "messages",
  "deadlines",
  "examReports",
  "teacherSimulations",
  "classUpdates",
  "patternReports",
  "predictions",
  "groupContributionRefs",
] as const;

export async function exportAllUserData(uid: string): Promise<Record<string, unknown>> {
  const profileSnap = await getDoc(doc(db, "users", uid));
  const data: Record<string, unknown> = { profile: profileSnap.exists() ? profileSnap.data() : null };

  for (const name of SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, "users", uid, name));
    data[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return data;
}

export async function deleteAllUserData(uid: string): Promise<void> {
  // Shared groupSignals contributions live outside users/{uid} — must be
  // cleaned up explicitly, and before the private markers that track them.
  await deleteAllGroupContributions(uid);

  for (const name of SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, "users", uid, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
  await deleteDoc(doc(db, "users", uid));
}
