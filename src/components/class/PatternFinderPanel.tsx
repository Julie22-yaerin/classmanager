"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { callApi } from "@/lib/apiClient";
import { toClassContext, toProfileContext, toMaterialSummary } from "@/lib/mappers";
import { listMaterialsForClass } from "@/lib/firestore/materials";
import { createPatternReport, listPatternReports } from "@/lib/firestore/patternReports";
import { getUserProfile } from "@/lib/firestore/profile";
import type { ClassDoc, PatternReportDoc } from "@/lib/firestore/types";
import type { PatternReportOutput } from "@/lib/patternFinder";
import { EvidenceBadge } from "@/components/class/WeightBars";

const PATTERN_TYPE_LABEL: Record<string, string> = {
  problem_reuse: "Problem reuse",
  structural_mimicry: "Structural mimicry",
  concept_emphasis: "Concept emphasis",
  phrasing_pattern: "Phrasing pattern",
  sequencing: "Sequencing",
  other: "Pattern",
};

const CONFIDENCE_LABEL = { high: "Strong match", medium: "Moderate match", low: "Weak match" } as const;

function PatternCard({ pattern }: { pattern: PatternReportDoc["patterns"][number] }) {
  return (
    <li className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {PATTERN_TYPE_LABEL[pattern.patternType] ?? pattern.patternType}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{pattern.title}</span>
        </div>
        <EvidenceBadge level={pattern.confidence} labels={CONFIDENCE_LABEL} />
      </div>
      <p className="mt-1.5 text-sm text-zinc-700 dark:text-zinc-300">{pattern.description}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{pattern.sourceTag}</p>
          <p className="mt-0.5 text-xs text-zinc-700 dark:text-zinc-300">{pattern.sourceExcerpt}</p>
        </div>
        <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Past exam</p>
          <p className="mt-0.5 text-xs text-zinc-700 dark:text-zinc-300">{pattern.matchedExcerpt}</p>
        </div>
      </div>
    </li>
  );
}

function ReportView({ report }: { report: PatternReportDoc }) {
  return (
    <div className="mt-4 flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <EvidenceBadge level={report.evidenceStrength} />
      </div>
      <p className="text-zinc-700 dark:text-zinc-300">{report.summary}</p>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Patterns found</h4>
        <ul className="mt-2 flex flex-col gap-2">
          {report.patterns.map((p, i) => (
            <PatternCard key={i} pattern={p} />
          ))}
          {report.patterns.length === 0 && <li className="text-zinc-400 italic">No strong patterns found yet — needs more materials.</li>}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">What to do with this</h4>
        <p className="mt-1 text-zinc-700 dark:text-zinc-300">{report.strategicImplication}</p>
      </div>
      <p className="text-xs text-zinc-400 italic">{report.caveat}</p>
    </div>
  );
}

export default function PatternFinderPanel({ cls, initialReports }: { cls: ClassDoc; initialReports: PatternReportDoc[] }) {
  const { user } = useAuth();
  const [reports, setReports] = useState(initialReports);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const [materials, profile] = await Promise.all([listMaterialsForClass(user.uid, cls.id), getUserProfile(user.uid)]);
      const pastExams = materials.filter((m) => m.tag === "PastExam").map(toMaterialSummary);
      const sourceMaterials = materials.filter((m) => !["PastExam", "Announcement"].includes(m.tag)).map(toMaterialSummary);

      const { report } = await callApi<{ report: PatternReportOutput }>("/api/pattern-finder", {
        cls: toClassContext(cls),
        profile: toProfileContext(profile),
        pastExams,
        sourceMaterials,
      });

      const saved = await createPatternReport(user.uid, {
        classId: cls.id,
        evidenceStrength: report.evidence_strength,
        patterns: report.patterns.map((p) => ({
          patternType: p.pattern_type,
          title: p.title,
          description: p.description,
          sourceTag: p.source_tag,
          sourceExcerpt: p.source_excerpt,
          matchedExcerpt: p.matched_excerpt,
          confidence: p.confidence,
        })),
        summary: report.summary,
        strategicImplication: report.strategic_implication,
        caveat: report.caveat,
        createdAt: new Date().toISOString(),
      });

      const refreshed = await listPatternReports(user.uid, cls.id);
      setReports(refreshed.length ? refreshed : [saved]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate pattern report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Pattern Finder</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Pairs specific homework/lecture material to specific past-exam questions to find how this teacher actually builds exams.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {busy ? "Analyzing…" : "Find patterns"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {reports.length === 0 && !busy && <p className="mt-3 text-sm text-zinc-500">No pattern report generated yet. Needs at least one past exam.</p>}
      {reports[0] && <ReportView report={reports[0]} />}
    </section>
  );
}
