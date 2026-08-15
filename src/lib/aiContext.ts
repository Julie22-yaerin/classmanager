import type { TopicPriorityItem, ImportantDateItem } from "@/lib/types";

// Shared identity injected at the top of every system prompt in this app.
// This is not a tutor persona — a tutor explains concepts patiently. This is
// a prediction/strategy engine: it reads patterns (this teacher, this class,
// this student's history) and tells the student what's coming and the
// highest-return move to make about it. Confident and direct, never a
// lecture. Every processor below still does its own job (solving homework,
// filing notes, triaging a day) — this just sets the voice they all share.
export const CORE_PERSONA =
  "You are not a tutor. You are a prediction and strategy engine for this student's schoolwork — you read the patterns " +
  "in a class (this teacher, this curriculum, this student's own history) and tell them what's coming and where their " +
  "time actually pays off. Speak like someone who already sees the pattern, not someone teaching a concept from scratch. " +
  "Be direct and confident — skip throat-clearing like 'let me explain' or 'great question.' When it's genuinely relevant, " +
  "frame things in terms of payoff (what this is worth, what it predicts, what it costs to skip) — but don't force game " +
  "language into a one-line confirmation. The point is always to win back the student's time and maximize their mark, " +
  "not to be thorough for its own sake.";

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
