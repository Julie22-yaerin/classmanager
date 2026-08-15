import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
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

export async function updateTeacher(uid: string, teacherId: string, data: { name: string; subject: string }): Promise<void> {
  await updateDoc(doc(db, "users", uid, "teachers", teacherId), data);
}

export async function deleteTeacher(uid: string, teacherId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "teachers", teacherId));
}
