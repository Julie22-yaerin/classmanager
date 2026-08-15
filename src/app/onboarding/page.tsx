"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { updateUserProfile } from "@/lib/firestore/profile";
import { createTeacher } from "@/lib/firestore/teachers";
import { createClass } from "@/lib/firestore/classes";
import LaurelAvatar from "@/components/LaurelAvatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AI_STYLES, AI_STYLE_LABELS, AI_STYLE_DESCRIPTIONS, type AiStyle } from "@/lib/types";

const GOALS = [
  { id: "fast", label: "⚡ Finish schoolwork faster" },
  { id: "exam", label: "🎯 Prepare for exams" },
  { id: "understand", label: "🧠 Understand difficult topics" },
  { id: "deadlines", label: "📅 Keep track of deadlines" },
  { id: "notes", label: "🎙️ Turn classes into notes" },
];

const CURRICULA = ["IGCSE", "IB", "A-Level", "AP", "National curriculum", "Other"];
const GRADES = Array.from({ length: 8 }, (_, i) => `Grade ${i + 5}`);

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [goals, setGoals] = useState<string[]>([]);
  const [grade, setGrade] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [school, setSchool] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [aiStyle, setAiStyle] = useState<AiStyle>("adaptive");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  function toggleGoal(id: string) {
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    try {
      if (teacherName.trim() && teacherSubject.trim() && classGrade.trim()) {
        const teacher = await createTeacher(user.uid, teacherName.trim(), teacherSubject.trim());
        await createClass(user.uid, {
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherSubject: teacher.subject,
          grade: classGrade.trim(),
          subject: teacherSubject.trim(),
          textbook: null,
        });
      }
      await updateUserProfile(user.uid, {
        goals,
        grade: grade || null,
        curriculum: curriculum || null,
        school: school.trim() || null,
        aiStyle,
        onboardingComplete: true,
      });
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-12 dark:bg-[#212121]">
      <div className="mb-8 flex items-center gap-2">
        <LaurelAvatar size={32} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">School AI</span>
      </div>

      <div className="mb-8 flex gap-1.5">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"}`} />
        ))}
      </div>

      <div className="w-full max-w-md">
        {step === 1 && (
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">What are you here for?</h1>
            <p className="mt-1 text-sm text-zinc-500">What do you want School AI to help you with?</p>
            <div className="mt-6 flex flex-col gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    goals.includes(g.id)
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Your academic context</h1>
            <p className="mt-1 text-sm text-zinc-500">Three fields — everything else comes from your classes.</p>
            <div className="mt-6 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Grade
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Select…</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Curriculum
                <select
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Select…</option>
                  {CURRICULA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                School / system <span className="text-zinc-400">(optional)</span>
                <input
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Let&apos;s set up your first class</h1>
            <p className="mt-1 text-sm text-zinc-500">Optional — you can always add classes later.</p>
            <div className="mt-6 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Teacher name
                <input
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ms. Patel"
                  className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Subject
                <input
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  placeholder="Chemistry"
                  className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Class / Grade
                <input
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  placeholder="10"
                  className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">How should your AI work?</h1>
            <p className="mt-1 text-sm text-zinc-500">How do you want me to help?</p>
            <div className="mt-6 flex flex-col gap-2">
              {AI_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAiStyle(s)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    aiStyle === s
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="font-medium">{AI_STYLE_LABELS[s]}</div>
                  <div className={`text-xs ${aiStyle === s ? "opacity-80" : "text-zinc-500"}`}>{AI_STYLE_DESCRIPTIONS[s]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="text-sm text-zinc-500 hover:underline">
              Back
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            {step < 4 && (
              <button type="button" onClick={() => setStep((s) => s + 1)} className="text-sm text-zinc-500 hover:underline">
                Skip
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
              >
                {saving ? "Setting up…" : "Get started"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
