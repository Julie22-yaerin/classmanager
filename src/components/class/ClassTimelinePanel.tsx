"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { callApi } from "@/lib/apiClient";
import { toClassContext, toProfileContext } from "@/lib/mappers";
import { saveMaterialTimeline } from "@/lib/firestore/materials";
import { getUserProfile } from "@/lib/firestore/profile";
import { EvidenceBadge } from "@/components/class/WeightBars";
import type { ClassDoc, ClassTimeline, MaterialDoc } from "@/lib/firestore/types";
import type { ClassTimelineOutput } from "@/lib/classTimeline";

const TIMESTAMP_MARKER = /\[\d{1,2}:\d{2}\]/;

function DeadlineFlag({ action }: { action: string }) {
  return (
    <p className="mt-1 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">📌 {action}</p>
  );
}

function TimelineView({ timeline, highlight }: { timeline: ClassTimeline; highlight?: string }) {
  const term = highlight?.trim().toLowerCase();
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <EvidenceBadge level={timeline.evidenceStrength} />
      </div>
      <ol className="flex flex-col gap-1.5">
        {timeline.blocks.map((b, i) => {
          const matched = !!term && (b.topic.toLowerCase().includes(term) || b.summary.toLowerCase().includes(term));
          return (
            <li
              key={i}
              className={`rounded-md p-2 text-sm ${matched ? "bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:ring-amber-800" : "bg-zinc-50 dark:bg-zinc-950"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{b.topic}</span>
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">{b.label}</span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{b.summary}</p>
              {b.mentionsDeadline && b.flaggedAction && <DeadlineFlag action={b.flaggedAction} />}
            </li>
          );
        })}
        {timeline.blocks.length === 0 && <li className="text-sm text-zinc-400 italic">No blocks found.</li>}
      </ol>
      <p className="text-xs text-zinc-400 italic">{timeline.caveat}</p>
    </div>
  );
}

function RecordingRow({
  cls,
  material,
  highlight,
  onTimeline,
}: {
  cls: ClassDoc;
  material: MaterialDoc;
  highlight?: string;
  onTimeline: (materialId: string, timeline: ClassTimeline) => void;
}) {
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
        blocks: output.blocks.map((b) => ({
          label: b.label,
          topic: b.topic,
          summary: b.summary,
          mentionsDeadline: b.mentions_deadline,
          flaggedAction: b.mentions_deadline && b.flagged_action ? b.flagged_action : null,
        })),
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
      {material.timeline && <TimelineView timeline={material.timeline} highlight={highlight} />}
    </li>
  );
}

export default function ClassTimelinePanel({ cls, materials }: { cls: ClassDoc; materials: MaterialDoc[] }) {
  const [overrides, setOverrides] = useState<Record<string, ClassTimeline>>({});
  const [search, setSearch] = useState("");
  const recordings = materials.filter((m) => m.tag === "ClassRecording").map((m) => (overrides[m.id] ? { ...m, timeline: overrides[m.id] } : m));

  const matchCount = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return null;
    return recordings.reduce((sum, m) => {
      if (!m.timeline) return sum;
      return sum + m.timeline.blocks.filter((b) => b.topic.toLowerCase().includes(term) || b.summary.toLowerCase().includes(term)).length;
    }, 0);
  }, [recordings, search]);

  if (recordings.length === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-medium">Live Class Timeline</h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        Breaks each class recording into topic blocks you can jump to, instead of re-listening to the whole thing.
      </p>
      {recordings.some((m) => m.timeline) && (
        <div className="mt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find every time this teacher covered..."
            className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          {matchCount !== null && <p className="mt-1 text-xs text-zinc-500">{matchCount} matching block{matchCount === 1 ? "" : "s"} across recordings.</p>}
        </div>
      )}
      <ul className="mt-3 flex flex-col gap-2">
        {recordings.map((m) => (
          <RecordingRow key={m.id} cls={cls} material={m} highlight={search} onTimeline={(id, timeline) => setOverrides((prev) => ({ ...prev, [id]: timeline }))} />
        ))}
      </ul>
    </section>
  );
}
