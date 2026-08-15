"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { TeacherDTO, ClassDTO } from "@/lib/clientTypes";

export default function SetupPage() {
  const [teachers, setTeachers] = useState<TeacherDTO[]>([]);
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [teacherName, setTeacherName] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [teacherBusy, setTeacherBusy] = useState(false);

  const [classTeacherId, setClassTeacherId] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [classSubject, setClassSubject] = useState("");
  const [classTextbook, setClassTextbook] = useState("");
  const [classBusy, setClassBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [tRes, cRes] = await Promise.all([fetch("/api/teachers"), fetch("/api/classes")]);
    const tJson = await tRes.json();
    const cJson = await cRes.json();
    setTeachers(tJson.teachers ?? []);
    setClasses(cJson.classes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  async function createTeacher(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTeacherBusy(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teacherName, subject: teacherSubject }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create teacher");
      setTeacherName("");
      setTeacherSubject("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create teacher");
    } finally {
      setTeacherBusy(false);
    }
  }

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setClassBusy(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: classTeacherId,
          grade: classGrade,
          subject: classSubject,
          textbook: classTextbook,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create class");
      setClassGrade("");
      setClassSubject("");
      setClassTextbook("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setClassBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Teachers &amp; Classes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Onboarding: create your teachers, then the classes they teach. This is what the AI uses to learn how each class works.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-medium">Add a teacher</h2>
          <form onSubmit={createTeacher} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ms. Patel"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Subject
              <input
                required
                value={teacherSubject}
                onChange={(e) => setTeacherSubject(e.target.value)}
                placeholder="Chemistry"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <button
              type="submit"
              disabled={teacherBusy}
              className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              {teacherBusy ? "Adding…" : "Add teacher"}
            </button>
          </form>

          <ul className="mt-4 flex flex-col gap-1 text-sm">
            {teachers.map((t) => (
              <li key={t.id} className="flex justify-between rounded-md px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <span>{t.name}</span>
                <span className="text-zinc-500">{t.subject}</span>
              </li>
            ))}
            {!loading && teachers.length === 0 && <li className="text-zinc-500">No teachers yet.</li>}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-medium">Add a class</h2>
          <form onSubmit={createClass} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Teacher
              <select
                required
                value={classTeacherId}
                onChange={(e) => setClassTeacherId(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="" disabled>
                  Select a teacher
                </option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subject})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Grade
                <input
                  required
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  placeholder="10"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Subject
                <input
                  required
                  value={classSubject}
                  onChange={(e) => setClassSubject(e.target.value)}
                  placeholder="Chemistry"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Textbook / general materials
              <input
                value={classTextbook}
                onChange={(e) => setClassTextbook(e.target.value)}
                placeholder="Chemistry: The Central Science, 14th ed."
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <button
              type="submit"
              disabled={classBusy || teachers.length === 0}
              className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              {classBusy ? "Adding…" : "Add class"}
            </button>
            {teachers.length === 0 && <p className="text-xs text-zinc-500">Add a teacher first.</p>}
          </form>

          <ul className="mt-4 flex flex-col gap-1 text-sm">
            {classes.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <Link href={`/classes/${c.id}`} className="hover:underline">
                  {c.subject} · Grade {c.grade} — {c.teacher.name}
                </Link>
              </li>
            ))}
            {!loading && classes.length === 0 && <li className="text-zinc-500">No classes yet.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
