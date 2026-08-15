import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ClassDoc, TeacherPlaybook } from "@/lib/firestore/types";
import type { TopicPriorityItem, ImportantDateItem } from "@/lib/types";

function classesRef(uid: string) {
  return collection(db, "users", uid, "classes");
}

function classRef(uid: string, classId: string) {
  return doc(db, "users", uid, "classes", classId);
}

export async function listClasses(uid: string): Promise<ClassDoc[]> {
  const snap = await getDocs(query(classesRef(uid), orderBy("createdAt", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassDoc, "id">) }));
}

export async function getClass(uid: string, classId: string): Promise<ClassDoc | null> {
  const snap = await getDoc(classRef(uid, classId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<ClassDoc, "id">) }) : null;
}

export interface CreateClassInput {
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  grade: string;
  subject: string;
  textbook: string | null;
}

export async function createClass(uid: string, input: CreateClassInput): Promise<ClassDoc> {
  const now = new Date().toISOString();
  const data: Omit<ClassDoc, "id"> = {
    ...input,
    curriculum: null,
    teacherPersona: null,
    teachingStyle: null,
    questionStyle: null,
    assessmentPatterns: null,
    topicPriorities: [],
    importantDates: [],
    playbook: null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(classesRef(uid), data);
  return { id: ref.id, ...data };
}

export interface MemoryUpdate {
  curriculum_note?: string | null;
  teacher_persona?: string | null;
  teaching_style?: string | null;
  question_style?: string | null;
  assessment_patterns?: string | null;
  topic_priorities?: TopicPriorityItem[] | null;
}

export async function applyMemoryUpdate(uid: string, classId: string, cls: ClassDoc, updates: MemoryUpdate | null | undefined): Promise<void> {
  if (!updates) return;
  const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (updates.curriculum_note) {
    data.curriculum = cls.curriculum ? `${cls.curriculum}\n${updates.curriculum_note}` : updates.curriculum_note;
  }
  if (updates.teacher_persona) data.teacherPersona = updates.teacher_persona;
  if (updates.teaching_style) data.teachingStyle = updates.teaching_style;
  if (updates.question_style) data.questionStyle = updates.question_style;
  if (updates.assessment_patterns) data.assessmentPatterns = updates.assessment_patterns;
  if (updates.topic_priorities && updates.topic_priorities.length) data.topicPriorities = updates.topic_priorities;

  if (Object.keys(data).length <= 1) return;
  await updateDoc(classRef(uid, classId), data);
}

export async function appendImportantDates(uid: string, classId: string, cls: ClassDoc, dates: ImportantDateItem[]): Promise<void> {
  if (dates.length === 0) return;
  await updateDoc(classRef(uid, classId), {
    importantDates: [...cls.importantDates, ...dates],
    updatedAt: new Date().toISOString(),
  });
}

export async function saveTopicPriorities(uid: string, classId: string, topicPriorities: TopicPriorityItem[]): Promise<void> {
  if (topicPriorities.length === 0) return;
  await updateDoc(classRef(uid, classId), { topicPriorities, updatedAt: new Date().toISOString() });
}

export async function savePlaybook(uid: string, classId: string, playbook: TeacherPlaybook): Promise<void> {
  await updateDoc(classRef(uid, classId), { playbook, updatedAt: new Date().toISOString() });
}

export interface UpdateClassInput {
  grade: string;
  subject: string;
  textbook: string | null;
}

export async function updateClassBasics(uid: string, classId: string, input: UpdateClassInput): Promise<void> {
  await updateDoc(classRef(uid, classId), { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteClass(uid: string, classId: string): Promise<void> {
  await deleteDoc(classRef(uid, classId));
}
