"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { callApi, MissingApiKeyClientError } from "@/lib/apiClient";
import { toClassContext, toProfileContext } from "@/lib/mappers";
import { listMaterialsForClass } from "@/lib/firestore/materials";
import { createExamReport, listExamReports } from "@/lib/firestore/examReports";
import { saveTopicPriorities } from "@/lib/firestore/classes";
import { getUserProfile } from "@/lib/firestore/profile";
import type { ClassDoc, ExamReportDoc, MaterialDoc } from "@/lib/firestore/types";
import type { ExamReportOutput, MaterialSummary } from "@/lib/examMode";

interface ParsedTopic {
  topic: string;
  weight?: number;
  reason?: string;
  evidence?: string;
}

function toMaterialSummary(m: MaterialDoc): MaterialSummary {
  return {
    tag: m.tag,
    topic: m.topic,
    excerpt: m.rawContent || m.extractedText || m.fileName || "",
    analysis: m.analysis ? JSON.stringify(m.analysis) : null,
  };
}

function ReportView({ report }: { report: ExamReportDoc }) {
  const topicPriority = report.topicPriority as ParsedTopic[];
  const markDistribution = report.markDistribution;
  const weakAreas = report.weakAreas as ParsedTopic[];

  return (
    <div className="mt-4 flex flex-col gap-4 text-sm">
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Topic priority</h4>
        <ul className="mt-1 flex flex-col gap-1">
          {topicPriority.map((t, i) => (
            <li key={i}>
              <span className="rounded bg-zinc-100 px-1.5 text-xs font-medium dark:bg-zinc-800">{t.weight}/5</span> <strong>{t.topic}</strong>{" "}
              <span className="text-zinc-500">— {t.reason}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Question-pattern analysis</h4>
        <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{report.patternAnalysis}</p>
      </div>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Estimated mark distribution</h4>
        <ul className="mt-1 flex flex-col gap-1">
          {markDistribution.map((m, i) => (
            <li key={i}>
              {m.topic} — {m.estimated_percent}%
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Weak areas</h4>
        <ul className="mt-1 flex flex-col gap-1">
          {weakAreas.map((w, i) => (
            <li key={i}>
              <strong>{w.topic}</strong> <span className="text-zinc-500">— {w.evidence}</span>
            </li>
          ))}
          {weakAreas.length === 0 && <li className="text-zinc-400 italic">None detected yet</li>}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mock exam</h4>
        <div className="mt-1 whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">{report.mockExam}</div>
      </div>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Rapid review sheet</h4>
        <div className="mt-1 whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">{report.reviewSheet}</div>
      </div>
      <p className="text-xs text-zinc-400 italic">
        This is an informed estimate from your class&apos;s history, not a guarantee of what will be on the actual exam.
      </p>
    </div>
  );
}

export default function ExamModePanel({ cls, initialReports }: { cls: ClassDoc; initialReports: ExamReportDoc[] }) {
  const { user } = useAuth();
  const [reports, setReports] = useState(initialReports);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);

  async function generate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setMissingKey(false);
    try {
      const [materials, profile] = await Promise.all([listMaterialsForClass(user.uid, cls.id), getUserProfile(user.uid)]);
      const pastExams = materials.filter((m) => m.tag === "PastExam").map(toMaterialSummary);
      const homework = materials.filter((m) => m.tag === "Homework").map(toMaterialSummary);
      const otherMaterials = materials.filter((m) => !["PastExam", "Homework"].includes(m.tag)).map(toMaterialSummary);

      const { report } = await callApi<{ report: ExamReportOutput }>("/api/exam-mode", {
        cls: toClassContext(cls),
        profile: toProfileContext(profile),
        pastExams,
        homework,
        otherMaterials,
      });

      const saved = await createExamReport(user.uid, {
        classId: cls.id,
        topicPriority: report.topic_priority,
        patternAnalysis: report.question_pattern_analysis,
        markDistribution: report.mark_distribution,
        weakAreas: report.weak_areas,
        mockExam: report.mock_exam,
        reviewSheet: report.review_sheet,
        createdAt: new Date().toISOString(),
      });
      if (report.topic_priority.length) await saveTopicPriorities(user.uid, cls.id, report.topic_priority);

      const refreshed = await listExamReports(user.uid, cls.id);
      setReports(refreshed.length ? refreshed : [saved]);
    } catch (err) {
      if (err instanceof MissingApiKeyClientError) {
        setMissingKey(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate report");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Exam Mode</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Synthesizes past exams, homework, materials, curriculum, and known weaknesses into exam prep.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {busy ? "Generating…" : "Generate exam prep"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error} {missingKey && "(the app's AI key isn't configured — this is on us, not you)"}
        </p>
      )}
      {reports.length === 0 && !busy && <p className="mt-3 text-sm text-zinc-500">No exam prep generated yet.</p>}
      {reports[0] && <ReportView report={reports[0]} />}
    </section>
  );
}
