import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ReferenceItemDoc } from "@/lib/firestore/types";

function referenceItemsRef(uid: string) {
  return collection(db, "users", uid, "referenceItems");
}

export async function recordReferenceItems(uid: string, items: Omit<ReferenceItemDoc, "id">[]): Promise<void> {
  if (items.length === 0) return;
  await Promise.all(items.map((item) => addDoc(referenceItemsRef(uid), item)));
}

export async function listReferenceItems(uid: string): Promise<ReferenceItemDoc[]> {
  const snap = await getDocs(referenceItemsRef(uid));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ReferenceItemDoc, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReferenceItemsForClass(uid: string, classId: string): Promise<ReferenceItemDoc[]> {
  const snap = await getDocs(query(referenceItemsRef(uid), where("classId", "==", classId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ReferenceItemDoc, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
