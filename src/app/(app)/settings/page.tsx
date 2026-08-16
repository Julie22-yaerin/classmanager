"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { getUserProfile, updateUserProfile } from "@/lib/firestore/profile";
import { exportAllUserData, deleteAllUserData } from "@/lib/firestore/dataControls";
import { deleteAllGroupContributions } from "@/lib/firestore/groupSignals";
import { AI_STYLES, AI_STYLE_LABELS, AI_STYLE_DESCRIPTIONS, type AiStyle } from "@/lib/types";
import {
  canNotify,
  isReminderEnabled,
  requestNotificationPermission,
  setReminderEnabled,
} from "@/lib/notifications";
import InstallAppSection from "@/components/InstallAppSection";
import type { UserProfile } from "@/lib/firestore/types";

const ANALYTICS_CONSENT_KEY = "cm_analytics_consent";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [learningStatus, setLearningStatus] = useState<string | null>(null);
  const learningEditGeneration = useRef(0);

  const [analyticsConsent, setAnalyticsConsent] = useState<"accepted" | "declined" | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setProfile((await getUserProfile(user.uid)) ?? {});
      setProfileLoaded(true);
    })();
  }, [user]);

  function setProfileField<K extends keyof UserProfile>(field: K, value: UserProfile[K]) {
    setProfile((p) => ({ ...p, [field]: value }));
    learningEditGeneration.current += 1;
    setLearningStatus(null);
  }

  useEffect(() => {
    (async () => {
      const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
      if (stored === "accepted" || stored === "declined") setAnalyticsConsent(stored);
      setRemindersEnabled(isReminderEnabled());
      setNotifPermission(canNotify() ? Notification.permission : "unsupported");
    })();
  }, []);

  async function toggleField(field: "allowRecordingUploads" | "shareGroupIntelligence", value: boolean) {
    if (!user) return;
    setProfile((p) => ({ ...p, [field]: value }));
    try {
      await updateUserProfile(user.uid, { [field]: value });
      // Turning Group Intelligence off withdraws what's already been shared,
      // not just stops future sharing — otherwise "off" would be a lie.
      if (field === "shareGroupIntelligence" && !value) {
        await deleteAllGroupContributions(user.uid);
      }
    } catch {
      setProfile((p) => ({ ...p, [field]: !value }));
    }
  }

  async function saveLearningProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const generation = learningEditGeneration.current;
    setLearningStatus("Saving…");
    try {
      await updateUserProfile(user.uid, {
        aiStyle: profile.aiStyle,
        academicLevel: profile.academicLevel,
        explanationStyle: profile.explanationStyle,
        communicationStyle: profile.communicationStyle,
        learningPreferences: profile.learningPreferences,
        weaknesses: profile.weaknesses,
      });
      // Only report success if no field changed since this save started —
      // otherwise a late response could mark a newer, unsaved edit as "Saved."
      if (learningEditGeneration.current === generation) setLearningStatus("Saved.");
    } catch {
      if (learningEditGeneration.current === generation) setLearningStatus("Failed to save.");
    }
  }

  async function toggleReminders(value: boolean) {
    if (value) {
      const permission = await requestNotificationPermission();
      setNotifPermission(permission);
      if (permission !== "granted") {
        setRemindersEnabled(false);
        setReminderEnabled(false);
        return;
      }
    }
    setReminderEnabled(value);
    setRemindersEnabled(value);
  }

  function chooseAnalyticsConsent(value: "accepted" | "declined") {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    setAnalyticsConsent(value);
  }

  async function handleExportData() {
    if (!user) return;
    setExporting(true);
    try {
      const data = await exportAllUserData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lyceum-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    setAccountError(null);
    try {
      await deleteAllUserData(user.uid);
      await deleteUser(auth.currentUser!);
      router.push("/login");
    } catch (err) {
      const code = (err as { code?: string }).code;
      setAccountError(
        code === "auth/requires-recent-login"
          ? "For your security, sign out and sign back in, then try deleting again right away."
          : "Failed to delete account — try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Settings</h1>
      {user && <p className="mt-1 text-sm text-zinc-500">Signed in as {user.email}</p>}

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">How you learn</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Applies across every class so predictions and plans adapt to you.</p>
        <form onSubmit={saveLearningProfile} className="mt-3 flex flex-col gap-3">
          <fieldset disabled={!profileLoaded} className="flex flex-col gap-3 disabled:opacity-50">
            <div className="flex flex-col gap-1 text-sm">
              How should your AI work?
              <div className="mt-1 grid grid-cols-2 gap-2">
                {AI_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!profileLoaded}
                    onClick={() => setProfileField("aiStyle", s as AiStyle)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      profile.aiStyle === s
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <div className="font-medium">{AI_STYLE_LABELS[s]}</div>
                    <div className={profile.aiStyle === s ? "opacity-80" : "text-zinc-500"}>{AI_STYLE_DESCRIPTIONS[s]}</div>
                  </button>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Academic level
              <input
                value={profile.academicLevel ?? ""}
                onChange={(e) => setProfileField("academicLevel", e.target.value)}
                placeholder="e.g. 10th grade, mid-tier in math, strong in writing"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Preferred explanation style
              <input
                value={profile.explanationStyle ?? ""}
                onChange={(e) => setProfileField("explanationStyle", e.target.value)}
                placeholder="e.g. step-by-step with worked examples, visual analogies"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Preferred communication style
              <input
                value={profile.communicationStyle ?? ""}
                onChange={(e) => setProfileField("communicationStyle", e.target.value)}
                placeholder="e.g. blunt and concise, encouraging tone"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Learning preferences
              <input
                value={profile.learningPreferences ?? ""}
                onChange={(e) => setProfileField("learningPreferences", e.target.value)}
                placeholder="e.g. prefers practice problems over theory"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Weaknesses / recurring mistakes
              <textarea
                value={profile.weaknesses ?? ""}
                onChange={(e) => setProfileField("weaknesses", e.target.value)}
                rows={3}
                placeholder="e.g. mixes up sin/cos identities, forgets significant figures"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <button type="submit" className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900">
              Save
            </button>
          </fieldset>
          {!profileLoaded && <span className="text-xs text-zinc-500">Loading…</span>}
          {learningStatus && <span className="text-xs text-zinc-500">{learningStatus}</span>}
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Deadline reminders</h2>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={(e) => toggleReminders(e.target.checked)}
            disabled={notifPermission === "unsupported" || notifPermission === "denied"}
            className="mt-0.5"
          />
          <span>
            Notify me 3 days and 1 day before a deadline
            <span className="mt-0.5 block text-xs text-zinc-500">
              {notifPermission === "unsupported"
                ? "Your browser doesn't support notifications."
                : notifPermission === "denied"
                  ? "Notifications are blocked for this site — allow them in your browser's site settings, then reload."
                  : "Uses your browser's notification permission and only fires while you've had Lyceum open recently — it can't wake up when the app is fully closed. True background push would need server-side infrastructure Lyceum doesn't have yet."}
            </span>
          </span>
        </label>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Privacy &amp; data</h2>
        <div className="mt-3 flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile.allowRecordingUploads !== false}
              onChange={(e) => toggleField("allowRecordingUploads", e.target.checked)}
            />
            Allow attaching audio recordings (transcribed by AI)
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile.shareGroupIntelligence === true}
              onChange={(e) => toggleField("shareGroupIntelligence", e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Share anonymized topic-priority signals with other students in the same class (Group Intelligence)
              <span className="mt-0.5 block text-xs text-zinc-500">
                Only a topic name and its priority weight (1–5) are shared — never reasons, evidence, or any other content. Classes are matched by
                teacher name, subject, and grade across accounts, which is approximate, not verified. Turning this off withdraws everything you&apos;ve
                already shared, not just future updates.
              </span>
            </span>
          </label>

          <div>
            <p className="text-sm">Analytics cookies</p>
            <p className="text-xs text-zinc-500">Helps us see which features get used — never sold or shared.</p>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => chooseAnalyticsConsent("accepted")}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  analyticsConsent === "accepted" ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                Allow
              </button>
              <button
                type="button"
                onClick={() => chooseAnalyticsConsent("declined")}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  analyticsConsent === "declined" ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                Decline
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm">Your data</p>
            <p className="text-xs text-zinc-500">Everything you&apos;ve sent — classes, materials, messages, deadlines, exam reports.</p>
            <button
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              className="mt-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-zinc-700"
            >
              {exporting ? "Preparing…" : "Download my data"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Account</h2>
        {user && <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>}
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
        >
          Sign out
        </button>
      </section>

      <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <h2 className="font-medium text-red-800 dark:text-red-300">Delete account</h2>
        <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
          Permanently deletes your account and everything in it — classes, materials, messages, deadlines, exam reports. This can&apos;t be undone.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm dark:border-red-800 dark:bg-zinc-950"
          />
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
        {accountError && <p className="mt-2 text-xs text-red-700 dark:text-red-400">{accountError}</p>}
      </section>

      <InstallAppSection />
    </main>
  );
}
