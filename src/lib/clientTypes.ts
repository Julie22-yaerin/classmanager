import type { Tag, Mode } from "@/lib/types";

export interface TeacherDTO {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

export interface ClassDTO {
  id: string;
  teacherId: string;
  teacher: TeacherDTO;
  grade: string;
  subject: string;
  textbook: string | null;
  curriculum: string | null;
  teacherPersona: string | null;
  teachingStyle: string | null;
  questionStyle: string | null;
  assessmentPatterns: string | null;
  topicPriorities: string | null;
  importantDates: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDTO {
  id: string;
  classId: string;
  tag: Tag;
  title: string | null;
  sourceType: string;
  rawContent: string | null;
  extractedText: string | null;
  topic: string | null;
  analysis: string | null;
  fileName: string | null;
  mimeType: string | null;
  createdAt: string;
}

export interface DeadlineDTO {
  id: string;
  classId: string;
  class?: ClassDTO;
  title: string;
  dueDate: string | null;
  sourceType: string;
  notes: string | null;
  done: boolean;
  createdAt: string;
}

export interface ChatMessageDTO {
  id: string;
  classId: string | null;
  role: "user" | "assistant";
  tag: Tag | null;
  mode: Mode | null;
  content: string;
  fileName: string | null;
  materialId: string | null;
  createdAt: string;
}

export interface ExamReportDTO {
  id: string;
  classId: string;
  topicPriority: string;
  patternAnalysis: string;
  markDistribution: string;
  weakAreas: string;
  mockExam: string;
  reviewSheet: string;
  createdAt: string;
}

export interface ClassDetailDTO extends ClassDTO {
  materials: MaterialDTO[];
  deadlines: DeadlineDTO[];
  examReports: ExamReportDTO[];
}

export interface StudentProfileDTO {
  id: string;
  academicLevel: string | null;
  explanationStyle: string | null;
  communicationStyle: string | null;
  learningPreferences: string | null;
  weaknesses: string | null;
  updatedAt: string;
}
