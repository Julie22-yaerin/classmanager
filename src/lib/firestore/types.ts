import type { Tag, Mode, HomeworkMode, SourceType, TopicPriorityItem, ImportantDateItem } from "@/lib/types";

export interface UserProfile {
  email: string | null;
  displayName: string | null;
  createdAt: string;
  onboardingComplete: boolean;

  // Onboarding screen 1
  goals: string[];

  // Onboarding screen 2
  grade: string | null;
  curriculum: string | null;
  school: string | null;

  // Onboarding screen 4 / global preference
  aiStyle: "fast" | "explain" | "exam" | "adaptive";

  // Student memory (DRM v0.3 section 5)
  academicLevel: string | null;
  explanationStyle: string | null;
  communicationStyle: string | null;
  learningPreferences: string | null;
  weaknesses: string | null;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

export interface TeacherPlaybook {
  howToDealWithThisTeacher: string[];
  questionStyleSummary: string;
  explanationStyleSummary: string;
  gradingExpectations: string;
  classroomExpectations: string;
  recurringPatterns: string;
  generatedAt: string;
}

export interface ClassDoc {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  grade: string;
  subject: string;
  textbook: string | null;

  curriculum: string | null;
  teacherPersona: string | null;
  teachingStyle: string | null;
  questionStyle: string | null;
  assessmentPatterns: string | null;
  topicPriorities: TopicPriorityItem[];
  importantDates: ImportantDateItem[];
  playbook: TeacherPlaybook | null;

  createdAt: string;
  updatedAt: string;
}

export interface MaterialDoc {
  id: string;
  classId: string;
  className: string;
  tag: Tag;
  sourceType: SourceType;
  rawContent: string | null;
  extractedText: string | null;
  topic: string | null;
  analysis: Record<string, unknown> | null;
  fileName: string | null;
  mimeType: string | null;
  createdAt: string;
}

export interface DeadlineDoc {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  title: string;
  dueDate: string | null;
  sourceType: "announcement" | "recording";
  notes: string | null;
  done: boolean;
  createdAt: string;
}

export interface MessageDoc {
  id: string;
  classId: string | null;
  className: string | null;
  role: "user" | "assistant";
  tag: Tag | null;
  mode: Mode | null;
  homeworkMode: HomeworkMode | null;
  content: string;
  fileName: string | null;
  materialId: string | null;
  createdAt: string;
}

export interface ExamReportDoc {
  id: string;
  classId: string;
  topicPriority: { topic: string; weight: number; reason: string }[];
  patternAnalysis: string;
  markDistribution: { topic: string; estimated_percent: number }[];
  weakAreas: { topic: string; evidence: string }[];
  mockExam: string;
  reviewSheet: string;
  createdAt: string;
}
