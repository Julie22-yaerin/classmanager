"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { getUserProfile, updateUserProfile } from "@/lib/firestore/profile";
import { exportAllUserData, deleteAllUserData } from "@/lib/firestore/dataControls";
import { connectGoogleCalendar, disconnectGoogleCalendar, getValidCalendarToken } from "@/lib/googleCalendar";
import InstallAppSection from "@/components/InstallAppSection";
import { AI_STYLES, AI_STYLE_LABELS, AI_STYLE_DESCRIPTIONS, type AiStyle } from "@/lib/types";
import type { UserProfile } from "@/lib/firestore/types";

const ANALYTICS_CONSENT_KEY = "cm_analytics_consent";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const [analyticsConsent, setAnalyticsConsent] = useState<"accepted" | "declined" | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setProfile((await getUserProfile(user.uid)) ?? {});
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
      if (stored === "accepted" || stored === "declined") setAnalyticsConsent(stored);
      setCalendarConnected(!!getValidCalendarToken());
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileStatus("Saving…");
    try {
      await updateUserProfile(user.uid, profile);
      setProfileStatus("Saved.");
    } catch {
      setProfileStatus("Failed to save.");
    }
  }

  async function toggleField(field: "allowRecordingUploads" | "calendarAutoSync", value: boolean) {
    if (!user) return;
    setProfile((p) => ({ ...p, [field]: value }));
    try {
      await updateUserProfile(user.uid, { [field]: value });
    } catch {
      setProfile((p) => ({ ...p, [field]: !value }));
    }
  }

  function chooseAnalyticsConsent(value: "accepted" | "declined") {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    setAnalyticsConsent(value);
  }

  async function handleConnectCalendar() {
    setCalendarBusy(true);
    setCalendarError(null);
    try {
      await connectGoogleCalendar();
      setCalendarConnected(true);
    } catch {
      setCalendarError("Couldn't connect Google Calendar — try again.");
    } finally {
      setCalendarBusy(false);
    }
  }

  function handleDisconnectCalendar() {
    disconnectGoogleCalendar();
    setCalendarConnected(false);
    if (user) toggleField("calendarAutoSync", false);
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
      a.download = `school-ai-data-${new Date().toISOString().slice(0, 10)}.json`;
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
        <h2 className="font-medium">Student profile</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Global — applies across every class so responses adapt to you.</p>
        <form onSubmit={saveProfile} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-sm">
            How should your AI work?
            <div className="mt-1 grid grid-cols-2 gap-2">
              {AI_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, aiStyle: s as AiStyle }))}
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
              onChange={(e) => setProfile((p) => ({ ...p, academicLevel: e.target.value }))}
              placeholder="e.g. 10th grade, mid-tier in math, strong in writing"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Preferred explanation style
            <input
              value={profile.explanationStyle ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, explanationStyle: e.target.value }))}
              placeholder="e.g. step-by-step with worked examples, visual analogies"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Preferred communication style
            <input
              value={profile.communicationStyle ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, communicationStyle: e.target.value }))}
              placeholder="e.g. blunt and concise, encouraging tone"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Learning preferences
            <input
              value={profile.learningPreferences ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, learningPreferences: e.target.value }))}
              placeholder="e.g. prefers practice problems over theory"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Weaknesses / recurring mistakes
            <textarea
              value={profile.weaknesses ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, weaknesses: e.target.value }))}
              rows={3}
              placeholder="e.g. mixes up sin/cos identities, forgets significant figures"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button type="submit" className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
            Save profile
          </button>
          {profileStatus && <span className="text-xs text-zinc-500">{profileStatus}</span>}
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Google Calendar</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Let deadlines and homework the AI finds get added to your calendar automatically.</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            {calendarConnected ? (
              <span className="text-green-600 dark:text-green-400">✓ Connected for this session</span>
            ) : (
              <span className="text-zinc-500">Not connected</span>
            )}
          </div>
          <button
            type="button"
            onClick={calendarConnected ? handleDisconnectCalendar : handleConnectCalendar}
            disabled={calendarBusy}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-zinc-700"
          >
            {calendarBusy ? "Connecting…" : calendarConnected ? "Disconnect" : "Connect Google Calendar"}
          </button>
        </div>
        {calendarError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{calendarError}</p>}
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!profile.calendarAutoSync}
            disabled={!calendarConnected}
            onChange={(e) => toggleField("calendarAutoSync", e.target.checked)}
          />
          Auto-add new deadlines to my calendar
        </label>
        <p className="mt-2 text-xs text-zinc-400">
          Access is session-only — nothing is stored on our servers. If auto-add stops working, just reconnect here; it means the session expired.
        </p>
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
