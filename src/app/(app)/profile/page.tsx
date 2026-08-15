"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { getUserProfile, updateUserProfile } from "@/lib/firestore/profile";
import { AI_STYLES, AI_STYLE_LABELS, AI_STYLE_DESCRIPTIONS, type AiStyle } from "@/lib/types";
import type { UserProfile } from "@/lib/firestore/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setProfile((await getUserProfile(user.uid)) ?? {});
    })();
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setStatus("Saving…");
    try {
      await updateUserProfile(user.uid, profile);
      setStatus("Saved.");
    } catch {
      setStatus("Failed to save.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-zinc-500">How you learn — applies across every class so predictions and plans adapt to you.</p>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={saveProfile} className="flex flex-col gap-3">
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
          {status && <span className="text-xs text-zinc-500">{status}</span>}
        </form>
      </section>
    </main>
  );
}
