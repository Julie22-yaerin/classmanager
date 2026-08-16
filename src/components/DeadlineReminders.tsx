"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { listDeadlines } from "@/lib/firestore/deadlines";
import { checkDeadlineReminders, isReminderEnabled } from "@/lib/notifications";

export default function DeadlineReminders() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !isReminderEnabled()) return;
    (async () => {
      const deadlines = await listDeadlines(user.uid);
      checkDeadlineReminders(deadlines);
    })();
  }, [user]);

  return null;
}
