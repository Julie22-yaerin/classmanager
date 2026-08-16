"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { listDeadlines } from "@/lib/firestore/deadlines";
import { checkDeadlineReminders, isReminderEnabled, REMINDERS_CHANGED_EVENT } from "@/lib/notifications";

const RECHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function DeadlineReminders() {
  const { user } = useAuth();

  const runCheck = useCallback(async () => {
    if (!user || !isReminderEnabled()) return;
    const deadlines = await listDeadlines(user.uid);
    checkDeadlineReminders(deadlines);
  }, [user]);

  useEffect(() => {
    runCheck();

    function onVisible() {
      if (document.visibilityState === "visible") runCheck();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(REMINDERS_CHANGED_EVENT, runCheck);
    window.addEventListener("focus", runCheck);
    const interval = window.setInterval(runCheck, RECHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(REMINDERS_CHANGED_EVENT, runCheck);
      window.removeEventListener("focus", runCheck);
      window.clearInterval(interval);
    };
  }, [runCheck]);

  return null;
}
