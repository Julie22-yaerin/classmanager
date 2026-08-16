"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { callApi } from "@/lib/apiClient";
import { toClassContext, toProfileContext } from "@/lib/mappers";
import { listMaterialsForClass } from "@/lib/firestore/materials";
import { listExamReports } from "@/lib/firestore/examReports";
import { createTeacherSimulation, listTeacherSimulations } from "@/lib/firestore/teacherSimulations";
import { recordPredictions } from "@/lib/firestore/predictions";
import { extractFromTeacherSimulation } from "@/lib/predictionLedger";
import { getUserProfile } from "@/lib/firestore/profile";
import type { ClassDoc, TeacherSimulationDoc, MaterialDoc } from "@/lib/firestore/types";
import type { TeacherSimulationOutput } from "@/lib/teacherSimulator";
import type { MaterialSummary } from "@/lib/examMode";
import { EvidenceBadge } from "@/components/class/WeightBars";

const IMPACT_STYLE: Record<"high" | "medium" | "low", string> = {
  high: "text-[#c8942f]",
  medium: "text-zinc-600 dark:text-zinc-400",
  low: "text-zinc-400 dark:text-zinc-500",
};

function toMaterialSummary(m: MaterialDoc): MaterialSummary {
  return {
    tag: m.tag,
    topic: m.topic,
    excerpt: m.rawContent || m.extractedText || m.fileName || "",
    analysis: m.analysis ? JSON.stringify(m.analysis) : null,
  };
}

function ScoreRange({ label, low, high, dim }: { label: string; low: number; high: number; dim?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
          {low}–{high}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full"
          style={{
            marginLeft: `${low}%`,
            width: `${Math.max(2, high - low)}%`,
            backgroundColor: dim ? "#c8942f66" : "#c8942f",
          }}
        />
      </div>
    </div>
  );
}

function SimulationView({ sim }: { sim: TeacherSimulationDoc }) {
  return (
    <div className="mt-4 flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <EvidenceBadge level={sim.evidenceStrength} />
      </div>
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Likely next session</h4>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {sim.nextSessionPrediction.likelyFocus.map((topic, i) => (
            <span key={i} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium dark:bg-zinc-800">
              {topic}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-zinc-600 dark:text-zinc-300">{sim.nextSessionPrediction.reasoning}</p>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Questions they might ask</h4>
        <ul className="mt-1 flex flex-col gap-2">
          {sim.likelyQuestions.map((q, i) => (
            <li key={i} className="rounded-md bg-zinc-50 p-2.5 dark:bg-zinc-950">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{q.question}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {q.topic} — {q.styleNote}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Study plan — highest return first</h4>
        <ol className="mt-1 flex flex-col gap-1.5">
          {sim.studyPlan.map((item, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md bg-zinc-50 px-2 py-1.5 dark:bg-zinc-950">
              <span className="mt-0.5 shrink-0 text-xs text-zinc-400">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.action}</span>
                  <span className="shrink-0 text-xs text-zinc-500">~{item.estimatedMinutes} min</span>
                </div>
                <p className="text-xs text-zinc-500">{item.topic}</p>
                <p className={`mt-0.5 text-xs font-medium uppercase tracking-wide ${IMPACT_STYLE[item.markImpact]}`}>{item.markImpact} impact</p>
                <p className="mt-0.5 text-zinc-600 dark:text-zinc-300">{item.reason}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Projected outcome</h4>
        <div className="mt-2 flex flex-col gap-2">
          <ScoreRange label="Right now" low={sim.projectedScore.baselineLow} high={sim.projectedScore.baselineHigh} dim />
          <ScoreRange label="If you follow this plan" low={sim.projectedScore.projectedLow} high={sim.projectedScore.projectedHigh} />
        </div>
        <p className="mt-2 text-xs text-zinc-400 italic">{sim.projectedScore.caveat}</p>
      </div>
    </div>
  );
}

export default function TeacherSimulatorPanel({ cls, initialSimulations }: { cls: ClassDoc; initialSimulations: TeacherSimulationDoc[] }) {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState(initialSimulations);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const [materials, examReports, profile] = await Promise.all([
        listMaterialsForClass(user.uid, cls.id),
        listExamReports(user.uid, cls.id, 1),
        getUserProfile(user.uid),
      ]);
      const recentMaterials = [...materials].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 15).map(toMaterialSummary);
      const weakAreas = examReports[0]?.weakAreas ?? [];

      const { simulation } = await callApi<{ simulation: TeacherSimulationOutput }>("/api/teacher-simulator", {
        cls: toClassContext(cls),
        profile: toProfileContext(profile),
        recentMaterials,
        weakAreas,
      });

      const saved = await createTeacherSimulation(user.uid, {
        classId: cls.id,
        evidenceStrength: simulation.evidence_strength,
        nextSessionPrediction: {
          likelyFocus: simulation.next_session_prediction.likely_focus,
          reasoning: simulation.next_session_prediction.reasoning,
        },
        likelyQuestions: simulation.likely_questions.map((q) => ({ question: q.question, topic: q.topic, styleNote: q.style_note })),
        studyPlan: simulation.study_plan.map((s) => ({
          action: s.action,
          topic: s.topic,
          estimatedMinutes: s.estimated_minutes,
          markImpact: s.mark_impact,
          reason: s.reason,
        })),
        projectedScore: {
          baselineLow: simulation.projected_score.baseline_low,
          baselineHigh: simulation.projected_score.baseline_high,
          projectedLow: simulation.projected_score.projected_low,
          projectedHigh: simulation.projected_score.projected_high,
          caveat: simulation.projected_score.caveat,
        },
        createdAt: new Date().toISOString(),
      });
      await recordPredictions(user.uid, extractFromTeacherSimulation(simulation, saved.id, cls.id, `${cls.subject} · ${cls.teacherName}`));

      const refreshed = await listTeacherSimulations(user.uid, cls.id);
      setSimulations(refreshed.length ? refreshed : [saved]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate prediction");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Teacher Simulator</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Predicts what&apos;s next, what might get asked, and where your study time pays off most.</p>
        </div>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {busy ? "Predicting…" : "Predict"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {simulations.length === 0 && !busy && <p className="mt-3 text-sm text-zinc-500">No prediction yet.</p>}
      {simulations[0] && <SimulationView sim={simulations[0]} />}
    </section>
  );
}
