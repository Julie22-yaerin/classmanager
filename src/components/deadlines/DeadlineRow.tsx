"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/lib/authContext";
import { setDeadlineDone } from "@/lib/firestore/deadlines";
import type { DeadlineDoc } from "@/lib/firestore/types";

export default function DeadlineRow({ deadline }: { deadline: DeadlineDoc }) {
  const { user } = useAuth();
  const [done, setDone] = useState(deadline.done);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (!user) return;
    const next = !done;
    setDone(next);
    startTransition(async () => {
      await setDeadlineDone(user.uid, deadline.id, next);
    });
  }

  return (
    <li className="flex items-start gap-3 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-800">
      <input type="checkbox" checked={done} onChange={toggle} disabled={isPending} className="mt-1" />
      <div className="flex-1">
        <p className={`text-sm ${done ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200"}`}>{deadline.title}</p>
        <p className="text-xs text-zinc-500">
          {deadline.className} · {deadline.teacherName}
          {deadline.dueDate ? ` — due ${new Date(deadline.dueDate).toLocaleDateString()}` : " — no date"}
        </p>
        {deadline.notes && <p className="mt-0.5 text-xs text-zinc-500">{deadline.notes}</p>}
      </div>
    </li>
  );
}
