import type { CoverageStatus, CurriculumUnit } from "@/lib/firestore/types";

const STATUS_LEVEL: Record<CoverageStatus, number> = { not_covered: 0, in_progress: 1, covered: 2 };
const LEVEL_LABEL = ["low", "medium", "high"] as const;

export interface CurriculumChange {
  label: string;
  fromLevel: "low" | "medium" | "high" | "new";
  toLevel: "low" | "medium" | "high";
  reason: string;
}

function flatten(units: CurriculumUnit[]): { label: string; status: CoverageStatus }[] {
  const out: { label: string; status: CoverageStatus }[] = [];
  for (const u of units) {
    out.push({ label: u.label, status: u.status });
    for (const t of u.topics) {
      out.push({ label: t.label, status: t.status });
      for (const c of t.concepts) {
        out.push({ label: c.label, status: c.status });
      }
    }
  }
  return out;
}

function reasonFor(label: string, toLevel: "low" | "medium" | "high"): string {
  if (toLevel === "high") return `Now covered — material exists for "${label}".`;
  if (toLevel === "medium") return `Started — "${label}" has been introduced but not reinforced with material yet.`;
  return `"${label}" is now known to be part of this class's scope.`;
}

// Only fires when a node's coverage crosses a level (mirrors diffTopicPriorities'
// bucket-crossing rule) — a node that stays "covered" across two regenerations
// isn't news, one that just became covered is.
export function diffCurriculumCoverage(previous: CurriculumUnit[], next: CurriculumUnit[]): CurriculumChange[] {
  const prevByLabel = new Map(flatten(previous).map((n) => [n.label.trim().toLowerCase(), n.status]));
  const changes: CurriculumChange[] = [];

  for (const node of flatten(next)) {
    const key = node.label.trim().toLowerCase();
    const prevStatus = prevByLabel.get(key);
    const toLevel = LEVEL_LABEL[STATUS_LEVEL[node.status]];

    if (prevStatus === undefined) {
      if (node.status !== "not_covered") changes.push({ label: node.label, fromLevel: "new", toLevel, reason: reasonFor(node.label, toLevel) });
      continue;
    }

    if (STATUS_LEVEL[node.status] > STATUS_LEVEL[prevStatus]) {
      const fromLevel = LEVEL_LABEL[STATUS_LEVEL[prevStatus]];
      changes.push({ label: node.label, fromLevel, toLevel, reason: reasonFor(node.label, toLevel) });
    }
  }

  return changes;
}
