import { prisma } from "@/lib/db";
import type { RespondToolInput } from "@/lib/respondTool";
import type { Class, StudentProfile } from "@/generated/prisma/client";
import type { TopicPriorityItem } from "@/lib/types";

export function buildClassMemoryContext(cls: Class & { teacher: { name: string; subject: string } }): string {
  const lines: string[] = [];
  lines.push(`Class: ${cls.subject} (Grade ${cls.grade}), taught by ${cls.teacher.name}.`);
  if (cls.textbook) lines.push(`Textbook / materials: ${cls.textbook}`);
  if (cls.curriculum) lines.push(`Curriculum covered so far: ${cls.curriculum}`);
  if (cls.teacherPersona) lines.push(`Teacher persona: ${cls.teacherPersona}`);
  if (cls.teachingStyle) lines.push(`Teaching style: ${cls.teachingStyle}`);
  if (cls.questionStyle) lines.push(`Question style: ${cls.questionStyle}`);
  if (cls.assessmentPatterns) lines.push(`Assessment patterns: ${cls.assessmentPatterns}`);
  if (cls.topicPriorities) {
    try {
      const items = JSON.parse(cls.topicPriorities) as TopicPriorityItem[];
      if (items.length) {
        lines.push(
          `Topic priorities: ${items.map((i) => `${i.topic} (weight ${i.weight}: ${i.reason})`).join("; ")}`,
        );
      }
    } catch {
      // ignore malformed memory
    }
  }
  if (cls.importantDates) {
    try {
      const items = JSON.parse(cls.importantDates) as { title: string; date: string | null }[];
      if (items.length) {
        lines.push(`Known upcoming dates: ${items.map((i) => `${i.title}${i.date ? ` (${i.date})` : ""}`).join("; ")}`);
      }
    } catch {
      // ignore malformed memory
    }
  }
  return lines.join("\n");
}

export function buildStudentProfileContext(profile: StudentProfile | null): string {
  if (!profile) return "No student profile recorded yet — treat as an unknown baseline student.";
  const lines: string[] = [];
  if (profile.academicLevel) lines.push(`Academic level: ${profile.academicLevel}`);
  if (profile.explanationStyle) lines.push(`Preferred explanation style: ${profile.explanationStyle}`);
  if (profile.communicationStyle) lines.push(`Preferred communication style: ${profile.communicationStyle}`);
  if (profile.learningPreferences) lines.push(`Learning preferences: ${profile.learningPreferences}`);
  if (profile.weaknesses) lines.push(`Known weaknesses / recurring mistakes: ${profile.weaknesses}`);
  return lines.length ? lines.join("\n") : "No student profile recorded yet.";
}

export async function applyMemoryUpdates(classId: string, updates: RespondToolInput["memory_updates"]) {
  if (!updates) return;
  const cls = await prisma.class.findUniqueOrThrow({ where: { id: classId } });
  const data: Record<string, string> = {};

  if (updates.curriculum_note) {
    data.curriculum = cls.curriculum ? `${cls.curriculum}\n${updates.curriculum_note}` : updates.curriculum_note;
  }
  if (updates.teacher_persona) data.teacherPersona = updates.teacher_persona;
  if (updates.teaching_style) data.teachingStyle = updates.teaching_style;
  if (updates.question_style) data.questionStyle = updates.question_style;
  if (updates.assessment_patterns) data.assessmentPatterns = updates.assessment_patterns;
  if (updates.topic_priorities && updates.topic_priorities.length) {
    data.topicPriorities = JSON.stringify(updates.topic_priorities);
  }

  if (Object.keys(data).length === 0) return;
  await prisma.class.update({ where: { id: classId }, data });
}

export async function applyDeadlines(
  classId: string,
  deadlines: RespondToolInput["deadlines"],
  sourceType: "announcement" | "recording",
) {
  if (!deadlines || deadlines.length === 0) return;
  await prisma.deadline.createMany({
    data: deadlines.map((d) => ({
      classId,
      title: d.title,
      dueDate: d.due_date ? new Date(d.due_date) : null,
      sourceType,
      notes: d.notes ?? null,
    })),
  });

  const cls = await prisma.class.findUniqueOrThrow({ where: { id: classId } });
  const existing: { title: string; date: string | null; source: string }[] = cls.importantDates
    ? JSON.parse(cls.importantDates)
    : [];
  const merged = [
    ...existing,
    ...deadlines.map((d) => ({ title: d.title, date: d.due_date, source: sourceType })),
  ];
  await prisma.class.update({ where: { id: classId }, data: { importantDates: JSON.stringify(merged) } });
}

export async function getSingletonStudentProfile(): Promise<StudentProfile | null> {
  const existing = await prisma.studentProfile.findFirst();
  return existing;
}
