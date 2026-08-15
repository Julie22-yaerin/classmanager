import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TeacherSimulationDoc } from "@/lib/firestore/types";

function simulationsRef(uid: string) {
  return collection(db, "users", uid, "teacherSimulations");
}

export async function listTeacherSimulations(uid: string, classId: string, take = 5): Promise<TeacherSimulationDoc[]> {
  const snap = await getDocs(query(simulationsRef(uid), where("classId", "==", classId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<TeacherSimulationDoc, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, take);
}

export async function createTeacherSimulation(uid: string, data: Omit<TeacherSimulationDoc, "id">): Promise<TeacherSimulationDoc> {
  const ref = await addDoc(simulationsRef(uid), data);
  return { id: ref.id, ...data };
}
