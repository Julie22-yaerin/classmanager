export const TAGS = [
  "Homework",
  "PastExam",
  "ClassRecording",
  "Material",
  "Notes",
  "TeacherAnnouncement",
] as const;

export type Tag = (typeof TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  Homework: "Homework",
  PastExam: "Past Exam",
  ClassRecording: "Class Recording",
  Material: "Material",
  Notes: "Notes",
  TeacherAnnouncement: "Teacher Announcement",
};

export const TAG_DESCRIPTIONS: Record<Tag, string> = {
  Homework: "Get it solved/explained using this class's curriculum and teacher's methodology.",
  PastExam: "Analyze questions, topics, marks, difficulty, and recurring patterns.",
  ClassRecording: "Transcribe/summarize a lecture, extract homework, deadlines, and key statements.",
  Material: "Index a handout, slide, or reading and file it into class knowledge.",
  Notes: "Save personal notes into class knowledge.",
  TeacherAnnouncement: "Extract a task/date/deadline and create a reminder.",
};

export function isTag(value: unknown): value is Tag {
  return typeof value === "string" && (TAGS as readonly string[]).includes(value);
}

export type Mode = "daily" | "exam";

export type SourceType = "text" | "image" | "pdf" | "audio";

export interface TopicPriorityItem {
  topic: string;
  weight: number; // 1-5
  reason: string;
}

export interface ImportantDateItem {
  title: string;
  date: string | null;
  source: string;
}
