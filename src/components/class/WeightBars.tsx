const BAR_FILL = "#c8942f";

function Row({ label, sublabel, value, max, valueLabel }: { label: string; sublabel?: string; value: number; max: number; valueLabel: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">{valueLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${label}: ${valueLabel}`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BAR_FILL }} />
      </div>
      {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
    </li>
  );
}

export function TopicPriorityBars({ items }: { items: { topic: string; weight?: number; reason?: string }[] }) {
  const sorted = [...items].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  return (
    <ul className="mt-2 flex flex-col gap-3">
      {sorted.map((t, i) => (
        <Row key={i} label={t.topic} sublabel={t.reason} value={t.weight ?? 0} max={5} valueLabel={`${t.weight ?? 0}/5`} />
      ))}
    </ul>
  );
}

export function MarkDistributionBars({ items }: { items: { topic: string; estimated_percent: number }[] }) {
  const sorted = [...items].sort((a, b) => b.estimated_percent - a.estimated_percent);
  const max = Math.max(100, ...sorted.map((m) => m.estimated_percent));
  return (
    <ul className="mt-2 flex flex-col gap-3">
      {sorted.map((m, i) => (
        <Row key={i} label={m.topic} value={m.estimated_percent} max={max} valueLabel={`${m.estimated_percent}%`} />
      ))}
    </ul>
  );
}
