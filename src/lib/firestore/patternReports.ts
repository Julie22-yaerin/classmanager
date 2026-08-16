import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PatternReportDoc } from "@/lib/firestore/types";

function patternReportsRef(uid: string) {
  return collection(db, "users", uid, "patternReports");
}

export async function listPatternReports(uid: string, classId: string, take = 5): Promise<PatternReportDoc[]> {
  const snap = await getDocs(query(patternReportsRef(uid), where("classId", "==", classId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PatternReportDoc, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, take);
}

export async function createPatternReport(uid: string, data: Omit<PatternReportDoc, "id">): Promise<PatternReportDoc> {
  const ref = await addDoc(patternReportsRef(uid), data);
  return { id: ref.id, ...data };
}
