"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/lib/authContext";
import { setDeadlineDone } from "@/lib/firestore/deadlines";
import { createCalendarEvent, getValidCalendarToken } from "@/lib/googleCalendar";
import type { DeadlineDoc } from "@/lib/firestore/types";

export default function DeadlineRow({ deadline }: { deadline: DeadlineDoc }) {
  const { user } = useAuth();
  const [done, setDone] = useState(deadline.done);
  const [isPending, startTransition] = useTransition();
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  function toggle() {
    if (!user) return;
    const next = !done;
    setDone(next);
    startTransition(async () => {
      await setDeadlineDone(user.uid, deadline.id, next);
    });
  }

  async function addToCalendar() {
    if (!deadline.dueDate) return;
    setAddingToCalendar(true);
    const ok = await createCalendarEvent({
      title: `${deadline.className}: ${deadline.title}`,
      description: deadline.notes ?? undefined,
      date: deadline.dueDate,
    });
    setAddingToCalendar(false);
    setAddedToCalendar(ok);
  }

  return (
    <li className="flex items-start gap-3 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-800">
      <input type="checkbox" checked={done} onChange={toggle} disabled={isPending} className="mt-1" />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${done ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200"}`}>{deadline.title}</p>
          {deadline.dueDate && !done && getValidCalendarToken() && (
            <button
              onClick={addToCalendar}
              disabled={addingToCalendar || addedToCalendar}
              className="shrink-0 text-xs text-zinc-500 hover:underline disabled:no-underline disabled:opacity-60"
            >
              {addedToCalendar ? "✓ Added" : addingToCalendar ? "Adding…" : "+ Calendar"}
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {deadline.className} · {deadline.teacherName}
          {deadline.dueDate ? ` — due ${new Date(deadline.dueDate).toLocaleDateString()}` : " — no date"}
        </p>
        {deadline.notes && <p className="mt-0.5 text-xs text-zinc-500">{deadline.notes}</p>}
      </div>
    </li>
  );
}
