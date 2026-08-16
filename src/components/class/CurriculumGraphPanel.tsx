"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { callApi } from "@/lib/apiClient";
import { toClassContext, toProfileContext, toMaterialSummary } from "@/lib/mappers";
import { listMaterialsForClass } from "@/lib/firestore/materials";
import { saveCurriculumGraph } from "@/lib/firestore/classes";
import { recordClassUpdates } from "@/lib/firestore/classUpdates";
import { diffCurriculumCoverage } from "@/lib/curriculumChanges";
import { getUserProfile } from "@/lib/firestore/profile";
import type { ClassDoc, CoverageStatus, CurriculumTopic, CurriculumUnit, MaterialDoc } from "@/lib/firestore/types";
import type { CurriculumGraphOutput } from "@/lib/curriculumGraph";
import type { IdentifiedMaterialSummary } from "@/lib/patternFinder";
import { EvidenceBadge } from "@/components/class/WeightBars";

const STATUS_DOT: Record<CoverageStatus, string> = {
  covered: "bg-emerald-500",
  in_progress: "bg-amber-500",
  not_covered: "bg-zinc-300 dark:bg-zinc-700",
};

function toIdentifiedMaterialSummary(m: MaterialDoc): IdentifiedMaterialSummary {
  return { id: m.id, ...toMaterialSummary(m) };
}

function StatusDot({ status }: { status: CoverageStatus }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} aria-hidden />;
}

function ConceptRow({ concept }: { concept: { label: string; status: CoverageStatus; materialIds: string[] } }) {
  return (
    <li className="flex items-center gap-1.5 py-0.5 pl-6 text-xs text-zinc-600 dark:text-zinc-400">
      <StatusDot status={concept.status} />
      {concept.label}
      {concept.materialIds.length > 0 && (
        <span
          className="text-emerald-600 dark:text-emerald-400"
          title={`Traced to ${concept.materialIds.length} material${concept.materialIds.length === 1 ? "" : "s"} in this class`}
        >
          ✓
        </span>
      )}
    </li>
  );
}

function TopicNode({ topic }: { topic: CurriculumTopic }) {
  return (
    <li>
      <details open={topic.status !== "covered"}>
        <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm text-zinc-800 dark:text-zinc-200">
          <StatusDot status={topic.status} />
          <span className="font-medium">{topic.label}</span>
          {topic.concepts.length > 0 && <span className="text-xs text-zinc-400">({topic.concepts.length})</span>}
        </summary>
        {topic.concepts.length > 0 && (
          <ul className="ml-1 flex flex-col border-l border-zinc-100 pl-2 dark:border-zinc-800">
            {topic.concepts.map((c, i) => (
              <ConceptRow key={i} concept={c} />
            ))}
          </ul>
        )}
      </details>
    </li>
  );
}

function UnitNode({ unit }: { unit: CurriculumUnit }) {
  return (
    <li className="rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
      <details open>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          <StatusDot status={unit.status} />
          {unit.label}
        </summary>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {unit.topics.map((t, i) => (
            <TopicNode key={i} topic={t} />
          ))}
        </ul>
      </details>
    </li>
  );
}

export default function CurriculumGraphPanel({
  cls,
  onSaved,
  hasSignal,
}: {
  cls: ClassDoc;
  onSaved: (graph: NonNullable<ClassDoc["curriculumGraph"]>) => void;
  hasSignal: boolean;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const previousUnits = cls.curriculumGraph?.units ?? [];
      const [materials, profile] = await Promise.all([listMaterialsForClass(user.uid, cls.id), getUserProfile(user.uid)]);
      const { graph } = await callApi<{ graph: CurriculumGraphOutput }>("/api/curriculum-graph", {
        cls: toClassContext(cls),
        profile: toProfileContext(profile),
        materials: materials.map(toIdentifiedMaterialSummary),
        existingGraph: previousUnits,
      });

      const units: CurriculumUnit[] = graph.units.map((u) => ({
        label: u.label,
        status: u.status,
        topics: u.topics.map((t) => ({
          label: t.label,
          status: t.status,
          concepts: t.concepts.map((c) => ({ label: c.label, status: c.status, materialIds: c.material_ids })),
        })),
      }));

      const saved = {
        evidenceStrength: graph.evidence_strength,
        units,
        coverageSummary: graph.coverage_summary,
        gaps: graph.gaps,
        caveat: graph.caveat,
        updatedAt: new Date().toISOString(),
      };
      await saveCurriculumGraph(user.uid, cls.id, saved);
      onSaved(saved);

      const changes = diffCurriculumCoverage(previousUnits, units);
      if (changes.length) {
        await recordClassUpdates(
          user.uid,
          changes.map((c) => ({
            classId: cls.id,
            className: `${cls.subject} · ${cls.teacherName}`,
            topic: c.label,
            fromLevel: c.fromLevel,
            toLevel: c.toLevel,
            reason: c.reason,
            createdAt: new Date().toISOString(),
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate curriculum graph");
    } finally {
      setBusy(false);
    }
  }

  const graph = cls.curriculumGraph;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Curriculum Graph</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Units → topics → concepts, mapped from what&apos;s actually been taught and covered so far.</p>
        </div>
        <button
          onClick={generate}
          disabled={busy || !hasSignal}
          title={hasSignal ? undefined : "Add class materials or curriculum notes first"}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {busy ? "Mapping…" : graph ? "Refresh map" : "Map curriculum"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!hasSignal && !graph && <p className="mt-3 text-sm text-zinc-500">Add class materials or curriculum notes to map this class&apos;s curriculum.</p>}
      {hasSignal && !graph && !busy && <p className="mt-3 text-sm text-zinc-500">No curriculum map generated yet.</p>}
      {graph && (
        <div className="mt-4 flex flex-col gap-4 text-sm">
          <div className="flex items-center justify-between">
            <EvidenceBadge level={graph.evidenceStrength} />
          </div>
          <p className="text-zinc-700 dark:text-zinc-300">{graph.coverageSummary}</p>
          <ul className="flex flex-col gap-2">
            {graph.units.map((u, i) => (
              <UnitNode key={i} unit={u} />
            ))}
            {graph.units.length === 0 && <li className="text-zinc-400 italic">No units mapped yet.</li>}
          </ul>
          {graph.gaps.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900 dark:bg-amber-950">
              <h4 className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">Blind spots — no material yet</h4>
              <ul className="mt-1 list-disc pl-5 text-xs text-amber-900 dark:text-amber-200">
                {graph.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-zinc-400 italic">{graph.caveat}</p>
        </div>
      )}
    </section>
  );
}
