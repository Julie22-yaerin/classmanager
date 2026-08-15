import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MaterialDoc } from "@/lib/firestore/types";
import type { Tag } from "@/lib/types";

function materialsRef(uid: string) {
  return collection(db, "users", uid, "materials");
}

function byCreatedAtDesc(a: MaterialDoc, b: MaterialDoc) {
  return b.createdAt.localeCompare(a.createdAt);
}

// Filters and sorts are split (rather than a composite where+orderBy Firestore
// query) so this works without requiring a manually-created composite index.
export async function listMaterialsForClass(uid: string, classId: string): Promise<MaterialDoc[]> {
  const snap = await getDocs(query(materialsRef(uid), where("classId", "==", classId)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MaterialDoc, "id">) })).sort(byCreatedAtDesc);
}

export async function listRecentMaterialsByTag(uid: string, tag: Tag, take = 15): Promise<MaterialDoc[]> {
  const snap = await getDocs(query(materialsRef(uid), where("tag", "==", tag)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<MaterialDoc, "id">) }))
    .sort(byCreatedAtDesc)
    .slice(0, take);
}

export async function createMaterial(uid: string, data: Omit<MaterialDoc, "id">): Promise<MaterialDoc> {
  const ref = await addDoc(materialsRef(uid), data);
  return { id: ref.id, ...data };
}
