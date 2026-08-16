"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { listClasses, createClass as createClassDoc, updateClassBasics, deleteClass } from "@/lib/firestore/classes";
import type { ClassDoc } from "@/lib/firestore/types";

export default function SetupPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [teacherName, setTeacherName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [textbook, setTextbook] = useState("");
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editTextbook, setEditTextbook] = useState("");
  const [confirmDeleteClassId, setConfirmDeleteClassId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setClasses(await listClasses(user.uid));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      await createClassDoc(user.uid, {
        teacherName: teacherName.trim(),
        grade: grade.trim(),
        subject: subject.trim(),
        textbook: textbook.trim() || null,
      });
      setTeacherName("");
      setGrade("");
      setSubject("");
      setTextbook("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setBusy(false);
    }
  }

  function startEditClass(c: ClassDoc) {
    setEditingClassId(c.id);
    setEditTeacherName(c.teacherName);
    setEditGrade(c.grade);
    setEditSubject(c.subject);
    setEditTextbook(c.textbook ?? "");
    setConfirmDeleteClassId(null);
  }

  async function saveClassEdit(classId: string) {
    if (!user) return;
    setError(null);
    try {
      await updateClassBasics(user.uid, classId, {
        teacherName: editTeacherName.trim(),
        grade: editGrade.trim(),
        subject: editSubject.trim(),
        textbook: editTextbook.trim() || null,
      });
      setEditingClassId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class");
    }
  }

  async function confirmDeleteClass(classId: string) {
    if (!user) return;
    setError(null);
    try {
      await deleteClass(user.uid, classId);
      setConfirmDeleteClassId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete class");
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Classes</h1>
      <p className="mt-1 text-sm text-zinc-500">Every class you take, with its teacher — this is what the AI learns from.</p>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Add a class</h2>
        <form onSubmit={createClass} className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Teacher
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
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Chemistry"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Grade
            <input
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="10"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Textbook / general materials <span className="text-zinc-400">(optional)</span>
            <input
              value={textbook}
              onChange={(e) => setTextbook(e.target.value)}
              placeholder="Chemistry: The Central Science, 14th ed."
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {busy ? "Adding…" : "Add class"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Your classes</h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {classes.map((c) =>
            editingClassId === c.id ? (
              <li key={c.id} className="flex flex-col gap-1.5 rounded-md bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    value={editTeacherName}
                    onChange={(e) => setEditTeacherName(e.target.value)}
                    placeholder="Teacher"
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Subject"
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    placeholder="Grade"
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <input
                    value={editTextbook}
                    onChange={(e) => setEditTextbook(e.target.value)}
                    placeholder="Textbook"
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveClassEdit(c.id)}
                    className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingClassId(null)} className="text-xs text-zinc-500 hover:underline">
                    Cancel
                  </button>
                </div>
              </li>
            ) : (
              <li key={c.id} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <Link href={`/classes/${c.id}`} className="hover:underline">
                  {c.subject} · Grade {c.grade} — {c.teacherName}
                </Link>
                {confirmDeleteClassId === c.id ? (
                  <span className="flex shrink-0 gap-1.5">
                    <button onClick={() => confirmDeleteClass(c.id)} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                      Delete everything?
                    </button>
                    <button onClick={() => setConfirmDeleteClassId(null)} className="text-xs text-zinc-500 hover:underline">
                      No
                    </button>
                  </span>
                ) : (
                  <span className="flex shrink-0 gap-1.5">
                    <button onClick={() => startEditClass(c)} className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline dark:text-zinc-500 dark:hover:text-zinc-200">
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteClassId(c.id)}
                      className="text-xs text-red-500/70 hover:text-red-600 hover:underline dark:text-red-400/70 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </span>
                )}
              </li>
            ),
          )}
          {!loading && classes.length === 0 && <li className="text-zinc-500">No classes yet.</li>}
        </ul>
      </section>
    </main>
  );
}
