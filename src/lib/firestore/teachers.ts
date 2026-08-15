import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Teacher } from "@/lib/firestore/types";

function teachersRef(uid: string) {
  return collection(db, "users", uid, "teachers");
}

export async function listTeachers(uid: string): Promise<Teacher[]> {
  const snap = await getDocs(query(teachersRef(uid), orderBy("createdAt", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Teacher, "id">) }));
}

export async function createTeacher(uid: string, name: string, subject: string): Promise<Teacher> {
  const data = { name, subject, createdAt: new Date().toISOString() };
  const ref = await addDoc(teachersRef(uid), data);
  return { id: ref.id, ...data };
}
