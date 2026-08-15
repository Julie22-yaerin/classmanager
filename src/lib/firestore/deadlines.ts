import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DeadlineDoc } from "@/lib/firestore/types";

function deadlinesRef(uid: string) {
  return collection(db, "users", uid, "deadlines");
}

function byCreatedAtDesc(a: DeadlineDoc, b: DeadlineDoc) {
  return b.createdAt.localeCompare(a.createdAt);
}

export async function listDeadlines(uid: string, classId?: string): Promise<DeadlineDoc[]> {
  const q = classId ? query(deadlinesRef(uid), where("classId", "==", classId)) : deadlinesRef(uid);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DeadlineDoc, "id">) })).sort(byCreatedAtDesc);
}

export async function createDeadlines(uid: string, deadlines: Omit<DeadlineDoc, "id">[]): Promise<void> {
  await Promise.all(deadlines.map((d) => addDoc(deadlinesRef(uid), d)));
}

export async function setDeadlineDone(uid: string, deadlineId: string, done: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid, "deadlines", deadlineId), { done });
}
