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

  // Privacy & data preferences
  allowRecordingUploads: boolean;
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

export type CoverageStatus = "covered" | "in_progress" | "not_covered";

export interface CurriculumConcept {
  label: string;
  status: CoverageStatus;
  materialIds: string[];
}

export interface CurriculumTopic {
  label: string;
  status: CoverageStatus;
  concepts: CurriculumConcept[];
}

export interface CurriculumUnit {
  label: string;
  status: CoverageStatus;
  topics: CurriculumTopic[];
}

export interface CurriculumGraphDoc {
  evidenceStrength: "high" | "medium" | "low";
  units: CurriculumUnit[];
  coverageSummary: string;
  gaps: string[];
  caveat: string;
  updatedAt: string;
}

export interface ClassDoc {
  id: string;
  teacherName: string;
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
  curriculumGraph: CurriculumGraphDoc | null;

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
  evidenceStrength: "high" | "medium" | "low";
  topicPriority: { topic: string; weight: number; reason: string; evidence: string[] }[];
  patternAnalysis: string;
  markDistribution: { topic: string; estimated_percent: number }[];
  weakAreas: { topic: string; evidence: string }[];
  mockExam: string;
  reviewSheet: string;
  createdAt: string;
}

export interface ClassUpdateDoc {
  id: string;
  classId: string;
  className: string;
  topic: string;
  fromLevel: "low" | "medium" | "high" | "new";
  toLevel: "low" | "medium" | "high";
  reason: string;
  createdAt: string;
}

export interface PatternReportDoc {
  id: string;
  classId: string;
  evidenceStrength: "high" | "medium" | "low";
  patterns: {
    patternType: string;
    title: string;
    description: string;
    sourceTag: string;
    sourceMaterialId: string | null;
    sourceExcerpt: string;
    matchedMaterialId: string | null;
    matchedExcerpt: string;
    occurrenceCount: number;
    prepAction: string;
    confidence: "high" | "medium" | "low";
  }[];
  summary: string;
  strategicImplication: string;
  caveat: string;
  createdAt: string;
}

export interface TeacherSimulationDoc {
  id: string;
  classId: string;
  evidenceStrength: "high" | "medium" | "low";
  nextSessionPrediction: { likelyFocus: string[]; reasoning: string };
  likelyQuestions: { question: string; topic: string; styleNote: string }[];
  studyPlan: { action: string; topic: string; estimatedMinutes: number; markImpact: "high" | "medium" | "low"; reason: string }[];
  projectedScore: { baselineLow: number; baselineHigh: number; projectedLow: number; projectedHigh: number; caveat: string };
  createdAt: string;
}
