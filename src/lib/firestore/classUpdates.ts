import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ClassUpdateDoc } from "@/lib/firestore/types";

function updatesRef(uid: string) {
  return collection(db, "users", uid, "classUpdates");
}

export async function listRecentClassUpdates(uid: string, classId: string, take = 5): Promise<ClassUpdateDoc[]> {
  const snap = await getDocs(query(updatesRef(uid), where("classId", "==", classId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ClassUpdateDoc, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, take);
}

export async function recordClassUpdates(uid: string, updates: Omit<ClassUpdateDoc, "id">[]): Promise<void> {
  await Promise.all(updates.map((u) => addDoc(updatesRef(uid), u)));
}
