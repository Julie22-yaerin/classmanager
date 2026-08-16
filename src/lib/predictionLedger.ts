import type { ExamReportOutput } from "@/lib/examMode";
import type { TeacherSimulationOutput } from "@/lib/teacherSimulator";
import type { PatternReportOutput } from "@/lib/patternFinder";
import type { PredictionDoc } from "@/lib/firestore/types";

type NewPrediction = Omit<PredictionDoc, "id">;

function base(classId: string, className: string): Pick<NewPrediction, "classId" | "className" | "status" | "resolutionNote" | "createdAt" | "resolvedAt"> {
  return { classId, className, status: "pending", resolutionNote: null, createdAt: new Date().toISOString(), resolvedAt: null };
}

// Only weight >= 4 ("this will matter") is a confident enough claim to be
// worth tracking — logging every topic at every weight would drown the
// ledger in low-signal noise that's never worth resolving.
export function extractFromExamReport(report: ExamReportOutput, reportId: string, classId: string, className: string): NewPrediction[] {
  return report.topic_priority
    .filter((t) => t.weight >= 4)
    .map((t) => ({
      ...base(classId, className),
      source: "examMode",
      sourceReportId: reportId,
      claim: `"${t.topic}" will be a major focus on the next exam (priority ${t.weight}/5).`,
      confidence: t.weight === 5 ? "high" : "medium",
    }));
}

export function extractFromTeacherSimulation(sim: TeacherSimulationOutput, reportId: string, classId: string, className: string): NewPrediction[] {
  return sim.likely_questions.map((q) => ({
    ...base(classId, className),
    source: "teacherSimulator",
    sourceReportId: reportId,
    claim: `Teacher will ask something like: "${q.question}"`,
    confidence: sim.evidence_strength,
  }));
}

export function extractFromPatternReport(report: PatternReportOutput, reportId: string, classId: string, className: string): NewPrediction[] {
  return report.patterns
    .filter((p) => p.confidence === "high")
    .map((p) => ({
      ...base(classId, className),
      source: "patternFinder",
      sourceReportId: reportId,
      claim: `This pattern will repeat: ${p.title}.`,
      confidence: p.confidence,
    }));
}
