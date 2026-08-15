"use client";

import { TAGS, TAG_LABELS, TAG_DESCRIPTIONS, type Tag } from "@/lib/types";

export default function TagSelect({
  value,
  onChange,
  compact = false,
}: {
  value: Tag | "";
  onChange: (tag: Tag | "") => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value as Tag | "")}
        title={value ? TAG_DESCRIPTIONS[value] : "Tag required"}
        className={`rounded-full border px-3 py-1 text-xs font-medium ${
          value
            ? "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            : "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
        }`}
      >
        <option value="" disabled>
          Tag…
        </option>
        {TAGS.map((tag) => (
          <option key={tag} value={tag}>
            {TAG_LABELS[tag]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-500">
      Tag (required)
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value as Tag | "")}
        title={value ? TAG_DESCRIPTIONS[value] : undefined}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <option value="" disabled>
          Select a tag…
        </option>
        {TAGS.map((tag) => (
          <option key={tag} value={tag}>
            {TAG_LABELS[tag]}
          </option>
        ))}
      </select>
    </label>
  );
}
