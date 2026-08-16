import type { ClassDoc, UserProfile, MaterialDoc } from "@/lib/firestore/types";
import type { ClassContextInput, ProfileContextInput } from "@/lib/aiContext";
import type { MaterialSummary } from "@/lib/examMode";

export function toClassContext(cls: ClassDoc): ClassContextInput {
  return {
    subject: cls.subject,
    grade: cls.grade,
    teacherName: cls.teacherName,
    textbook: cls.textbook,
    curriculum: cls.curriculum,
    teacherPersona: cls.teacherPersona,
    teachingStyle: cls.teachingStyle,
    questionStyle: cls.questionStyle,
    assessmentPatterns: cls.assessmentPatterns,
    topicPriorities: cls.topicPriorities,
    importantDates: cls.importantDates,
  };
}

export function toProfileContext(profile: UserProfile | null): ProfileContextInput | null {
  if (!profile) return null;
  return {
    academicLevel: profile.academicLevel,
    explanationStyle: profile.explanationStyle,
    communicationStyle: profile.communicationStyle,
    learningPreferences: profile.learningPreferences,
    weaknesses: profile.weaknesses,
    grade: profile.grade,
    curriculum: profile.curriculum,
    aiStyle: profile.aiStyle,
  };
}

export function toMaterialSummary(m: MaterialDoc): MaterialSummary {
  return {
    tag: m.tag,
    topic: m.topic,
    excerpt: m.rawContent || m.extractedText || m.fileName || "",
    analysis: m.analysis ? JSON.stringify(m.analysis) : null,
  };
}
