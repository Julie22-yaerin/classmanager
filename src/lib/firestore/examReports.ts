import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExamReportDoc } from "@/lib/firestore/types";

function examReportsRef(uid: string) {
  return collection(db, "users", uid, "examReports");
}

export async function listExamReports(uid: string, classId: string, take = 5): Promise<ExamReportDoc[]> {
  const snap = await getDocs(query(examReportsRef(uid), where("classId", "==", classId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ExamReportDoc, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, take);
}

export async function createExamReport(uid: string, data: Omit<ExamReportDoc, "id">): Promise<ExamReportDoc> {
  const ref = await addDoc(examReportsRef(uid), data);
  return { id: ref.id, ...data };
}
