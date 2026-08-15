"use client";

import { useEffect, useState } from "react";
import type { StudentProfileDTO } from "@/lib/clientTypes";

export default function SettingsPage() {
  const [anthropicKeySet, setAnthropicKeySet] = useState(false);
  const [openaiKeySet, setOpenaiKeySet] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [keyStatus, setKeyStatus] = useState<string | null>(null);

  const [profile, setProfile] = useState<Partial<StudentProfileDTO>>({});
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [kRes, pRes] = await Promise.all([fetch("/api/settings/key"), fetch("/api/student-profile")]);
      const kJson = await kRes.json();
      const pJson = await pRes.json();
      setAnthropicKeySet(kJson.anthropicKeySet);
      setOpenaiKeySet(kJson.openaiKeySet);
      setProfile(pJson.profile ?? {});
    })();
  }, []);

  async function saveKeys(e: React.FormEvent) {
    e.preventDefault();
    setKeyStatus("Saving…");
    const res = await fetch("/api/settings/key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anthropicKey, openaiKey }),
    });
    if (res.ok) {
      setKeyStatus("Saved.");
      setAnthropicKey("");
      setOpenaiKey("");
      const kJson = await (await fetch("/api/settings/key")).json();
      setAnthropicKeySet(kJson.anthropicKeySet);
      setOpenaiKeySet(kJson.openaiKeySet);
    } else {
      setKeyStatus("Failed to save.");
    }
  }

  async function clearKey(key: "anthropic" | "openai") {
    await fetch("/api/settings/key", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (key === "anthropic") setAnthropicKeySet(false);
    else setOpenaiKeySet(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus("Saving…");
    const res = await fetch("/api/student-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setProfileStatus(res.ok ? "Saved." : "Failed to save.");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">API keys</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Keys are stored in an httpOnly cookie on this device and used server-side only — never exposed to the browser again.
        </p>
        <form onSubmit={saveKeys} className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Anthropic API key (required for chat) {anthropicKeySet && <span className="text-xs text-green-600 dark:text-green-400">● set</span>}
            <div className="flex gap-2">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-…"
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
              {anthropicKeySet && (
                <button type="button" onClick={() => clearKey("anthropic")} className="text-xs text-red-600 hover:underline dark:text-red-400">
                  clear
                </button>
              )}
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            OpenAI API key (optional — transcribes Class Recording audio) {openaiKeySet && <span className="text-xs text-green-600 dark:text-green-400">● set</span>}
            <div className="flex gap-2">
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-…"
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
              {openaiKeySet && (
                <button type="button" onClick={() => clearKey("openai")} className="text-xs text-red-600 hover:underline dark:text-red-400">
                  clear
                </button>
              )}
            </div>
            <span className="text-xs text-zinc-500">Without this, audio recordings are stored but not auto-transcribed — paste a transcript instead.</span>
          </label>
          <button type="submit" className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
            Save keys
          </button>
          {keyStatus && <span className="text-xs text-zinc-500">{keyStatus}</span>}
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Student profile</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Global — applies across every class so responses adapt to you.</p>
        <form onSubmit={saveProfile} className="mt-3 flex flex-col gap-3">
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
    </main>
  );
}
