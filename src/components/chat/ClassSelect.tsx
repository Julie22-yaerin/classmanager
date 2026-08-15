"use client";

import type { ClassDoc } from "@/lib/firestore/types";

export default function ClassSelect({
  classes,
  value,
  onChange,
  compact = false,
}: {
  classes: ClassDoc[];
  value: string;
  onChange: (classId: string) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
      >
        <option value="auto">Auto-detect class</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.subject} · Grade {c.grade} ({c.teacherName})
          </option>
        ))}
      </select>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-500">
      Class
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <option value="auto">Auto-detect</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.subject} · Grade {c.grade} ({c.teacherName})
          </option>
        ))}
      </select>
    </label>
  );
}
