export const TAGS = ["Homework", "PastExam", "ClassRecording", "Material", "Notes", "Announcement"] as const;

export type Tag = (typeof TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  Homework: "Homework",
  PastExam: "Past Exam",
  ClassRecording: "Class Recording",
  Material: "Material",
  Notes: "Notes",
  Announcement: "Announcement",
};

export const TAG_DESCRIPTIONS: Record<Tag, string> = {
  Homework: "Get it solved/explained using this class's curriculum and teacher's methodology.",
  PastExam: "Analyze questions, topics, marks, difficulty, and recurring patterns.",
  ClassRecording: "Transcribe/summarize a lecture, extract homework, deadlines, and key statements.",
  Material: "Index a handout, slide, or reading and file it into class knowledge.",
  Notes: "Save personal notes into class knowledge.",
  Announcement: "Extract a task/date/deadline and create a reminder.",
};

export function isTag(value: unknown): value is Tag {
  return typeof value === "string" && (TAGS as readonly string[]).includes(value);
}

export type Mode = "daily" | "exam";

export const HOMEWORK_MODES = ["fast", "explain", "stepByStep", "checkWork"] as const;
export type HomeworkMode = (typeof HOMEWORK_MODES)[number];

export const HOMEWORK_MODE_LABELS: Record<HomeworkMode, string> = {
  fast: "Fast Answer",
  explain: "Explain",
  stepByStep: "Step-by-step",
  checkWork: "Check My Work",
};

export const HOMEWORK_MODE_INSTRUCTIONS: Record<HomeworkMode, string> = {
  fast: "Give the shortest useful answer — the result and only the essential reasoning. No lecture.",
  explain: "Teach what's happening — explain the concept behind the problem, not just how to solve this one instance.",
  stepByStep: "Walk through the solution one step at a time, showing full working, matching the teacher's expected method.",
  checkWork: "The student has attempted this already (their attempt is in the message/attachment). Check it, point out exactly where it goes wrong if it does, and confirm what's correct — don't just redo it from scratch.",
};

export function isHomeworkMode(value: unknown): value is HomeworkMode {
  return typeof value === "string" && (HOMEWORK_MODES as readonly string[]).includes(value);
}

export type SourceType = "text" | "image" | "pdf" | "audio";

// Evidence Signal taxonomy for the deterministic prediction engine (see
// src/lib/evidenceEngine.ts). The LLM only ever extracts these — raw,
// typed observations — never a priority judgment; every score derived
// from them is computed in code, not asked of the model.
export const SIGNAL_TYPES = [
  "TEACHER_EMPHASIS",
  "TEACHER_REPETITION",
  "TEACHER_WARNING",
  "TEACHER_REVIEW",
  "HOMEWORK_ASSIGNMENT",
  "HOMEWORK_DIFFICULTY",
  "EXAM_HISTORY",
  "QUESTION_PATTERN",
  "TOPIC_RECURRENCE",
  "SYLLABUS_POSITION",
  "CURRICULUM_CENTRALITY",
  "SLIDE_EMPHASIS",
  "LECTURE_COVERAGE",
  "DEADLINE_PROXIMITY",
  "ASSESSMENT_ANNOUNCEMENT",
  "STUDENT_PERFORMANCE",
  "OTHER",
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export function slugifyTopic(label: string): string {
  const slug = label
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    .replace(/\p{M}/gu, "") // strip combining accent marks (é → e), but keep non-Latin letters (中文, العربية) distinct
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "topic";
}

export interface TopicPriorityItem {
  topic: string;
  weight: number; // 1-5
  reason: string;
  evidence?: string[];
}

export interface ImportantDateItem {
  title: string;
  date: string | null;
  source: string;
}

export const AI_STYLES = ["fast", "explain", "exam", "adaptive"] as const;
export type AiStyle = (typeof AI_STYLES)[number];

export const AI_STYLE_LABELS: Record<AiStyle, string> = {
  fast: "Fast",
  explain: "Explain",
  exam: "Exam",
  adaptive: "Adaptive",
};

export const AI_STYLE_DESCRIPTIONS: Record<AiStyle, string> = {
  fast: "Give me the shortest useful answer.",
  explain: "Teach me what's happening.",
  exam: "Focus on what matters for marks.",
  adaptive: "Decide the best approach for me.",
};
