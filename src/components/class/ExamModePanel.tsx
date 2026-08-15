"use client";

import { useState } from "react";
import type { ExamReportDTO } from "@/lib/clientTypes";

interface ParsedTopic {
  topic: string;
  weight?: number;
  reason?: string;
  evidence?: string;
}
interface ParsedMark {
  topic: string;
  estimated_percent: number;
}

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function ReportView({ report }: { report: ExamReportDTO }) {
  const topicPriority = safeParse<ParsedTopic[]>(report.topicPriority, []);
  const markDistribution = safeParse<ParsedMark[]>(report.markDistribution, []);
  const weakAreas = safeParse<ParsedTopic[]>(report.weakAreas, []);

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

export default function ExamModePanel({ classId, initialReports }: { classId: string; initialReports: ExamReportDTO[] }) {
  const [reports, setReports] = useState(initialReports);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/exam-mode/${classId}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate report");
      const reportsRes = await fetch(`/api/exam-mode/${classId}`);
      setReports((await reportsRes.json()).reports ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
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
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {reports.length === 0 && !busy && <p className="mt-3 text-sm text-zinc-500">No exam prep generated yet.</p>}
      {reports[0] && <ReportView report={reports[0]} />}
    </section>
  );
}
