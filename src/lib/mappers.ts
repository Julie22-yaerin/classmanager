import type { ClassDoc, UserProfile } from "@/lib/firestore/types";
import type { ClassContextInput, ProfileContextInput } from "@/lib/aiContext";

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
