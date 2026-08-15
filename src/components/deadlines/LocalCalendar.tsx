"use client";

import { useMemo, useState } from "react";
import DeadlineRow from "@/components/deadlines/DeadlineRow";
import type { DeadlineDoc } from "@/lib/firestore/types";

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function LocalCalendar({ deadlines }: { deadlines: DeadlineDoc[] }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(toDateKey(today));

  const byDate = useMemo(() => {
    const map = new Map<string, DeadlineDoc[]>();
    for (const d of deadlines) {
      if (!d.dueDate) continue;
      const key = d.dueDate.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(d);
      map.set(key, list);
    }
    return map;
  }, [deadlines]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [cursor]);

  const selectedItems = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ←
        </button>
        <h2 className="text-sm font-medium">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          →
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toDateKey(date);
          const items = byDate.get(key) ?? [];
          const isToday = key === toDateKey(today);
          const isSelected = key === selected;
          return (
            <button
              key={i}
              onClick={() => setSelected(key)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : isToday
                    ? "bg-zinc-100 font-medium dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{date.getDate()}</span>
              {items.length > 0 && (
                <span
                  className={`h-1 w-1 rounded-full ${
                    isSelected ? "bg-white dark:bg-zinc-900" : items.every((d) => d.done) ? "bg-zinc-300 dark:bg-zinc-600" : "bg-[#c8942f]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {selected ? new Date(selected).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "Pick a date"}
        </h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {selectedItems.map((d) => (
            <DeadlineRow key={d.id} deadline={d} />
          ))}
          {selected && selectedItems.length === 0 && <li className="text-sm text-zinc-500">Nothing due.</li>}
        </ul>
      </div>
    </div>
  );
}
