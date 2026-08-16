import type { DeadlineDoc } from "@/lib/firestore/types";

const NOTIFIED_KEY = "lyceum_notified_deadlines";
const ENABLED_KEY = "lyceum_deadline_reminders_enabled";

type NotifiedMap = Record<string, true>;

export function canNotify(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function isReminderEnabled(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(ENABLED_KEY) === "1";
}

export function setReminderEnabled(value: boolean): void {
  window.localStorage.setItem(ENABLED_KEY, value ? "1" : "0");
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!canNotify()) return "denied";
  if (Notification.permission === "default") return Notification.requestPermission();
  return Notification.permission;
}

function loadNotified(): NotifiedMap {
  try {
    return JSON.parse(window.localStorage.getItem(NOTIFIED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function daysUntil(dueDate: string): number {
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

// Fires a browser notification for each open deadline that's exactly 3 or 1 days
// out, deduped in localStorage so re-checking on every app open doesn't repeat.
// This only works while the app has been opened recently — the Notification API
// can't wake the browser once the tab/app is fully closed. Real background
// delivery needs push infrastructure (FCM + a scheduler), which this app
// deliberately doesn't have yet.
export function checkDeadlineReminders(deadlines: DeadlineDoc[]): void {
  if (!canNotify() || Notification.permission !== "granted") return;
  const notified = loadNotified();
  let changed = false;
  for (const d of deadlines) {
    if (d.done || !d.dueDate) continue;
    const days = daysUntil(d.dueDate);
    if (days !== 3 && days !== 1) continue;
    const key = `${d.id}:${days}`;
    if (notified[key]) continue;
    new Notification(`Due in ${days} day${days === 1 ? "" : "s"}: ${d.title}`, {
      body: `${d.className} · ${d.teacherName}`,
      tag: key,
    });
    notified[key] = true;
    changed = true;
  }
  if (changed) window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
}
