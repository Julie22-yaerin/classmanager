"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { listTeachers, createTeacher as createTeacherDoc, updateTeacher, deleteTeacher } from "@/lib/firestore/teachers";
import { listClasses, createClass as createClassDoc, updateClassBasics, deleteClass } from "@/lib/firestore/classes";
import type { Teacher, ClassDoc } from "@/lib/firestore/types";

export default function SetupPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
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

  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editTeacherSubject, setEditTeacherSubject] = useState("");
  const [confirmDeleteTeacherId, setConfirmDeleteTeacherId] = useState<string | null>(null);

  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassGrade, setEditClassGrade] = useState("");
  const [editClassSubject, setEditClassSubject] = useState("");
  const [editClassTextbook, setEditClassTextbook] = useState("");
  const [confirmDeleteClassId, setConfirmDeleteClassId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [t, c] = await Promise.all([listTeachers(user.uid), listClasses(user.uid)]);
    setTeachers(t);
    setClasses(c);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  async function createTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setTeacherBusy(true);
    try {
      await createTeacherDoc(user.uid, teacherName.trim(), teacherSubject.trim());
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
    if (!user) return;
    setError(null);
    setClassBusy(true);
    try {
      const teacher = teachers.find((t) => t.id === classTeacherId);
      if (!teacher) throw new Error("Pick a teacher");
      await createClassDoc(user.uid, {
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherSubject: teacher.subject,
        grade: classGrade.trim(),
        subject: classSubject.trim(),
        textbook: classTextbook.trim() || null,
      });
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

  function startEditTeacher(t: Teacher) {
    setEditingTeacherId(t.id);
    setEditTeacherName(t.name);
    setEditTeacherSubject(t.subject);
    setConfirmDeleteTeacherId(null);
  }

  async function saveTeacherEdit(teacherId: string) {
    if (!user) return;
    setError(null);
    try {
      await updateTeacher(user.uid, teacherId, { name: editTeacherName.trim(), subject: editTeacherSubject.trim() });
      setEditingTeacherId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update teacher");
    }
  }

  async function confirmDeleteTeacher(teacherId: string) {
    if (!user) return;
    if (classes.some((c) => c.teacherId === teacherId)) {
      setError("Can't delete a teacher who still has classes — delete or reassign those classes first.");
      setConfirmDeleteTeacherId(null);
      return;
    }
    setError(null);
    try {
      await deleteTeacher(user.uid, teacherId);
      setConfirmDeleteTeacherId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete teacher");
    }
  }

  function startEditClass(c: ClassDoc) {
    setEditingClassId(c.id);
    setEditClassGrade(c.grade);
    setEditClassSubject(c.subject);
    setEditClassTextbook(c.textbook ?? "");
    setConfirmDeleteClassId(null);
  }

  async function saveClassEdit(classId: string) {
    if (!user) return;
    setError(null);
    try {
      await updateClassBasics(user.uid, classId, {
        grade: editClassGrade.trim(),
        subject: editClassSubject.trim(),
        textbook: editClassTextbook.trim() || null,
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
            {teachers.map((t) =>
              editingTeacherId === t.id ? (
                <li key={t.id} className="flex flex-col gap-1.5 rounded-md bg-zinc-50 px-2 py-2 dark:bg-zinc-800">
                  <input
                    value={editTeacherName}
                    onChange={(e) => setEditTeacherName(e.target.value)}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <input
                    value={editTeacherSubject}
                    onChange={(e) => setEditTeacherSubject(e.target.value)}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveTeacherEdit(t.id)} className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
                      Save
                    </button>
                    <button onClick={() => setEditingTeacherId(null)} className="text-xs text-zinc-500 hover:underline">
                      Cancel
                    </button>
                  </div>
                </li>
              ) : (
                <li key={t.id} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <span>{t.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-500">{t.subject}</span>
                    {confirmDeleteTeacherId === t.id ? (
                      <span className="flex gap-1.5">
                        <button onClick={() => confirmDeleteTeacher(t.id)} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                          Confirm?
                        </button>
                        <button onClick={() => setConfirmDeleteTeacherId(null)} className="text-xs text-zinc-500 hover:underline">
                          No
                        </button>
                      </span>
                    ) : (
                      <span className="flex gap-1.5 opacity-0 group-hover:opacity-100">
                        <button onClick={() => startEditTeacher(t)} className="text-xs text-zinc-500 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => setConfirmDeleteTeacherId(t.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                          Delete
                        </button>
                      </span>
                    )}
                  </span>
                </li>
              ),
            )}
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
            {classes.map((c) =>
              editingClassId === c.id ? (
                <li key={c.id} className="flex flex-col gap-1.5 rounded-md bg-zinc-50 px-2 py-2 dark:bg-zinc-800">
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      value={editClassGrade}
                      onChange={(e) => setEditClassGrade(e.target.value)}
                      placeholder="Grade"
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    <input
                      value={editClassSubject}
                      onChange={(e) => setEditClassSubject(e.target.value)}
                      placeholder="Subject"
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>
                  <input
                    value={editClassTextbook}
                    onChange={(e) => setEditClassTextbook(e.target.value)}
                    placeholder="Textbook"
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveClassEdit(c.id)} className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
                      Save
                    </button>
                    <button onClick={() => setEditingClassId(null)} className="text-xs text-zinc-500 hover:underline">
                      Cancel
                    </button>
                  </div>
                </li>
              ) : (
                <li key={c.id} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800">
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
                    <span className="flex shrink-0 gap-1.5 opacity-0 group-hover:opacity-100">
                      <button onClick={() => startEditClass(c)} className="text-xs text-zinc-500 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => setConfirmDeleteClassId(c.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
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
      </div>
    </main>
  );
}
