const BAR_FILL = "#c8942f";

const EVIDENCE_LABEL: Record<"high" | "medium" | "low", string> = {
  high: "High evidence",
  medium: "Medium evidence",
  low: "Low evidence — thin material so far",
};

const EVIDENCE_STYLE: Record<"high" | "medium" | "low", string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function EvidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVIDENCE_STYLE[level]}`}>{EVIDENCE_LABEL[level]}</span>;
}

function Row({ label, sublabel, value, max, valueLabel }: { label: string; sublabel?: string; value: number; max: number; valueLabel: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">{valueLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${label}: ${valueLabel}`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BAR_FILL }} />
      </div>
      {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
    </div>
  );
}

export function TopicPriorityBars({ items }: { items: { topic: string; weight?: number; reason?: string; evidence?: string | string[] }[] }) {
  const sorted = [...items].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  return (
    <ul className="mt-2 flex flex-col gap-3">
      {sorted.map((t, i) => {
        const evidenceList = Array.isArray(t.evidence) ? t.evidence : t.evidence ? [t.evidence] : [];
        return (
          <li key={i}>
            <Row label={t.topic} sublabel={t.reason} value={t.weight ?? 0} max={5} valueLabel={`${t.weight ?? 0}/5`} />
            {evidenceList.length > 0 && (
              <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5 text-xs text-zinc-500">
                {evidenceList.map((e, j) => (
                  <li key={j}>{e}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function MarkDistributionBars({ items }: { items: { topic: string; estimated_percent: number }[] }) {
  const sorted = [...items].sort((a, b) => b.estimated_percent - a.estimated_percent);
  const max = Math.max(100, ...sorted.map((m) => m.estimated_percent));
  return (
    <ul className="mt-2 flex flex-col gap-3">
      {sorted.map((m, i) => (
        <li key={i}>
          <Row label={m.topic} value={m.estimated_percent} max={max} valueLabel={`${m.estimated_percent}%`} />
        </li>
      ))}
    </ul>
  );
}
