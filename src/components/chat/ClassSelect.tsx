"use client";

import type { ClassDTO } from "@/lib/clientTypes";

export default function ClassSelect({
  classes,
  value,
  onChange,
}: {
  classes: ClassDTO[];
  value: string;
  onChange: (classId: string) => void;
}) {
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
            {c.subject} · Grade {c.grade} ({c.teacher.name})
          </option>
        ))}
      </select>
    </label>
  );
}
