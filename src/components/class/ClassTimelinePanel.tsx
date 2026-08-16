"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { callApi } from "@/lib/apiClient";
import { toClassContext, toProfileContext } from "@/lib/mappers";
import { saveMaterialTimeline } from "@/lib/firestore/materials";
import { getUserProfile } from "@/lib/firestore/profile";
import { EvidenceBadge } from "@/components/class/WeightBars";
import type { ClassDoc, ClassTimeline, MaterialDoc } from "@/lib/firestore/types";
import type { ClassTimelineOutput } from "@/lib/classTimeline";

const TIMESTAMP_MARKER = /\[\d{1,2}:\d{2}\]/;

function TimelineView({ timeline }: { timeline: ClassTimeline }) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <EvidenceBadge level={timeline.evidenceStrength} />
      </div>
      <ol className="flex flex-col gap-1.5">
        {timeline.blocks.map((b, i) => (
          <li key={i} className="rounded-md bg-zinc-50 p-2 text-sm dark:bg-zinc-950">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{b.topic}</span>
              <span className="shrink-0 text-xs tabular-nums text-zinc-500">{b.label}</span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{b.summary}</p>
          </li>
        ))}
        {timeline.blocks.length === 0 && <li className="text-sm text-zinc-400 italic">No blocks found.</li>}
      </ol>
      <p className="text-xs text-zinc-400 italic">{timeline.caveat}</p>
    </div>
  );
}

function RecordingRow({ cls, material, onTimeline }: { cls: ClassDoc; material: MaterialDoc; onTimeline: (materialId: string, timeline: ClassTimeline) => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const transcript = material.extractedText || material.rawContent || "";
      const hasTimestamps = TIMESTAMP_MARKER.test(transcript);
      const profile = await getUserProfile(user.uid);

      const { timeline: output } = await callApi<{ timeline: ClassTimelineOutput }>("/api/class-timeline", {
        cls: toClassContext(cls),
        profile: toProfileContext(profile),
        transcript,
        hasTimestamps,
      });

      const timeline: ClassTimeline = {
        evidenceStrength: output.evidence_strength,
        hasTimestamps,
        blocks: output.blocks,
        caveat: output.caveat,
        generatedAt: new Date().toISOString(),
      };
      await saveMaterialTimeline(user.uid, material.id, timeline);
      onTimeline(material.id, timeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build timeline");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border border-zinc-100 p-2.5 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-zinc-900 dark:text-zinc-50">{material.topic ?? "Untopiced"}</p>
          <p className="text-xs text-zinc-500">{new Date(material.createdAt).toLocaleDateString()}</p>
        </div>
        <button
          onClick={generate}
          disabled={busy}
          className="shrink-0 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {busy ? "Building…" : material.timeline ? "Refresh" : "Build timeline"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {material.timeline && <TimelineView timeline={material.timeline} />}
    </li>
  );
}

export default function ClassTimelinePanel({ cls, materials }: { cls: ClassDoc; materials: MaterialDoc[] }) {
  const [overrides, setOverrides] = useState<Record<string, ClassTimeline>>({});
  const recordings = materials.filter((m) => m.tag === "ClassRecording");

  if (recordings.length === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-medium">Live Class Timeline</h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        Breaks each class recording into topic blocks you can jump to, instead of re-listening to the whole thing.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {recordings.map((m) => (
          <RecordingRow
            key={m.id}
            cls={cls}
            material={overrides[m.id] ? { ...m, timeline: overrides[m.id] } : m}
            onTimeline={(id, timeline) => setOverrides((prev) => ({ ...prev, [id]: timeline }))}
          />
        ))}
      </ul>
    </section>
  );
}
