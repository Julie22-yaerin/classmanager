import type { Tag } from "@/lib/types";

export const TAG_INSTRUCTIONS: Record<Tag, string> = {
  Homework:
    "This is a homework question. Solve/explain it the way this class's teacher would expect it solved — " +
    "match their methodology, notation, and level of rigor from the class memory below. " +
    "If you learn something new about how this teacher wants work shown, or which topic this touches, record it.",
  PastExam:
    "This is a past exam or exam question. Analyze it: identify topics covered, apparent difficulty, mark allocation if visible, " +
    "and any recurring patterns versus what's already known about this teacher's assessment style. Fill in exam_analysis. " +
    "Do not solve every question fully unless asked — focus on structural analysis, then briefly note anything a student should take away.",
  ClassRecording:
    "This is a class recording (transcript provided as text, since audio isn't auto-transcribed without a configured " +
    "transcription key). Summarize the lecture, extract any homework, deadlines, or key statements the teacher made, and update " +
    "class memory (curriculum, teacher persona/style) accordingly. Put any dates/tasks in the deadlines field.",
  Material:
    "This is course material (a handout, slide, or reading). Identify its topic and how it fits the curriculum, and note anything " +
    "it reveals about teaching style or topic priority. Keep the reply short — mainly confirm what was filed and where it fits.",
  Notes:
    "These are the student's own notes. File them into class knowledge. Keep the reply short and helpful — e.g. note gaps or connections " +
    "to other material, but do not lecture.",
  Announcement:
    "This is a teacher announcement. Extract every task, date, and deadline mentioned into the deadlines field (use null due_date only if " +
    "truly no date was given). Reply confirming what was captured and reminding the student what's now due and when.",
};

export function tagSourceForDeadlines(tag: Tag): "announcement" | "recording" {
  return tag === "Announcement" ? "announcement" : "recording";
}
