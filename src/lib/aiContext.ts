import type { TopicPriorityItem, ImportantDateItem } from "@/lib/types";

// Shared identity injected at the top of every system prompt in this app.
// This is not a tutor persona — a tutor explains concepts patiently. This AI
// is two things at once: the system that manages this student's school data
// (teacher patterns, class memory, deadlines) and the strategist who acts on
// it. Every processor below still does its own job (solving homework, filing
// notes, triaging a day) — this just sets the voice and delivery they share.
export const CORE_PERSONA =
  "You are two things at once: the system that manages this student's school data (teacher patterns, class memory, " +
  "deadlines) and the strategist who acts on it. Treat the class memory and student profile below as system state you " +
  "already maintain — check it before answering, the way a manager checks the record before reporting, not the way a " +
  "stranger looks something up. Reply like a strategist delivering a finding, not a tutor giving a lesson: short, cold, " +
  "high-value. Default to a few sentences or tight bullets — cut every hedge, every 'let me explain,' every restated " +
  "question. Only go long when the task itself requires length (full worked steps, a mock exam, a complete review " +
  "sheet) — even then, no filler around the substance. Frame things in terms of payoff (what this predicts, what it's " +
  "worth, what it costs to skip) when relevant. The point is always to win back the student's time and maximize their " +
  "mark, not to be thorough for its own sake.";

export interface ClassContextInput {
  subject: string;
  grade: string;
  teacherName: string;
  textbook: string | null;
  curriculum: string | null;
  teacherPersona: string | null;
  teachingStyle: string | null;
  questionStyle: string | null;
  assessmentPatterns: string | null;
  topicPriorities: TopicPriorityItem[];
  importantDates: ImportantDateItem[];
}

export function buildClassMemoryContext(cls: ClassContextInput): string {
  const lines: string[] = [];
  lines.push(`Class: ${cls.subject} (Grade ${cls.grade}), taught by ${cls.teacherName}.`);
  if (cls.textbook) lines.push(`Textbook / materials: ${cls.textbook}`);
  if (cls.curriculum) lines.push(`Curriculum covered so far: ${cls.curriculum}`);
  if (cls.teacherPersona) lines.push(`Teacher persona: ${cls.teacherPersona}`);
  if (cls.teachingStyle) lines.push(`Teaching style: ${cls.teachingStyle}`);
  if (cls.questionStyle) lines.push(`Question style: ${cls.questionStyle}`);
  if (cls.assessmentPatterns) lines.push(`Assessment patterns: ${cls.assessmentPatterns}`);
  if (cls.topicPriorities.length) {
    lines.push(
      `Topic priorities: ${cls.topicPriorities.map((i) => `${i.topic} (weight ${i.weight}: ${i.reason})`).join("; ")}`,
    );
  }
  if (cls.importantDates.length) {
    lines.push(`Known upcoming dates: ${cls.importantDates.map((i) => `${i.title}${i.date ? ` (${i.date})` : ""}`).join("; ")}`);
  }
  return lines.join("\n");
}

export interface ProfileContextInput {
  academicLevel?: string | null;
  explanationStyle?: string | null;
  communicationStyle?: string | null;
  learningPreferences?: string | null;
  weaknesses?: string | null;
  grade?: string | null;
  curriculum?: string | null;
  aiStyle?: string | null;
}

export function buildStudentProfileContext(profile: ProfileContextInput | null): string {
  if (!profile) return "No student profile recorded yet — treat as an unknown baseline student.";
  const lines: string[] = [];
  if (profile.grade) lines.push(`Grade: ${profile.grade}`);
  if (profile.curriculum) lines.push(`Curriculum: ${profile.curriculum}`);
  if (profile.academicLevel) lines.push(`Academic level: ${profile.academicLevel}`);
  if (profile.explanationStyle) lines.push(`Preferred explanation style: ${profile.explanationStyle}`);
  if (profile.communicationStyle) lines.push(`Preferred communication style: ${profile.communicationStyle}`);
  if (profile.learningPreferences) lines.push(`Learning preferences: ${profile.learningPreferences}`);
  if (profile.weaknesses) lines.push(`Known weaknesses / recurring mistakes: ${profile.weaknesses}`);
  if (profile.aiStyle) lines.push(`Preferred AI interaction style: ${profile.aiStyle}`);
  return lines.length ? lines.join("\n") : "No student profile recorded yet.";
}
