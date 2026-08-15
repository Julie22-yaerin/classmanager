"use client";

import { HOMEWORK_MODES, HOMEWORK_MODE_LABELS, type HomeworkMode } from "@/lib/types";

export default function HomeworkModeSelect({
  value,
  onChange,
  compact = false,
}: {
  value: HomeworkMode;
  onChange: (mode: HomeworkMode) => void;
  compact?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as HomeworkMode)}
      className={
        compact
          ? "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          : "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      }
    >
      {HOMEWORK_MODES.map((m) => (
        <option key={m} value={m}>
          {HOMEWORK_MODE_LABELS[m]}
        </option>
      ))}
    </select>
  );
}
