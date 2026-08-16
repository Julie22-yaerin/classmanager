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
  shareGroupIntelligence: boolean;
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

export interface TimelineBlock {
  label: string;
  topic: string;
  summary: string;
  mentionsDeadline: boolean;
  flaggedAction: string | null;
}

export interface ClassTimeline {
  evidenceStrength: "high" | "medium" | "low";
  hasTimestamps: boolean;
  blocks: TimelineBlock[];
  caveat: string;
  generatedAt: string;
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
  timeline: ClassTimeline | null;
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

export type PredictionSource = "examMode" | "teacherSimulator" | "patternFinder";
export type PredictionStatus = "pending" | "correct" | "incorrect" | "partial";

export interface PredictionDoc {
  id: string;
  classId: string;
  className: string;
  source: PredictionSource;
  sourceReportId: string;
  claim: string;
  confidence: "high" | "medium" | "low";
  status: PredictionStatus;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// Group Intelligence: shared, cross-student aggregate signals. These live
// outside users/{uid} — in a top-level groupSignals collection any
// consenting, signed-in user can read/write — since the whole point is
// combining signal across independent accounts. Only topic + weight is
// shared, never reasons, evidence, or any other class/material content.
export interface GroupSignalDoc {
  fingerprint: string;
  teacherName: string;
  subject: string;
  grade: string;
  createdAt: string;
}

export interface GroupContributionDoc {
  topicWeights: { topic: string; weight: number }[];
  contributedAt: string;
}

// Private marker under the contributing user's own uid, recording which
// shared fingerprints they've contributed to — lets account deletion clean
// up the corresponding shared contribution doc without needing to scan the
// whole groupSignals collection.
export interface GroupContributionRefDoc {
  id: string;
  fingerprint: string;
  updatedAt: string;
}
