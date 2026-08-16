"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { getClass } from "@/lib/firestore/classes";
import { listMaterialsForClass } from "@/lib/firestore/materials";
import { listDeadlines } from "@/lib/firestore/deadlines";
import { listExamReports } from "@/lib/firestore/examReports";
import { listPatternReports } from "@/lib/firestore/patternReports";
import ClassMemoryPanel from "@/components/class/ClassMemoryPanel";
import WhatChangedPanel from "@/components/class/WhatChangedPanel";
import MaterialsList from "@/components/class/MaterialsList";
import ExamModePanel from "@/components/class/ExamModePanel";
import PatternFinderPanel from "@/components/class/PatternFinderPanel";
import CurriculumGraphPanel from "@/components/class/CurriculumGraphPanel";
import TeacherPlaybookPanel from "@/components/class/TeacherPlaybookPanel";
import TeacherSimulatorPanel from "@/components/class/TeacherSimulatorPanel";
import ClassPredictionsPanel from "@/components/class/ClassPredictionsPanel";
import GroupIntelligencePanel from "@/components/class/GroupIntelligencePanel";
import ClassTimelinePanel from "@/components/class/ClassTimelinePanel";
import IntelligencePanel from "@/components/class/IntelligencePanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import { listTeacherSimulations } from "@/lib/firestore/teacherSimulations";
import type { ClassDoc, MaterialDoc, DeadlineDoc, ExamReportDoc, TeacherSimulationDoc, PatternReportDoc } from "@/lib/firestore/types";

const TABS = ["Overview", "Predict & prep", "Intelligence", "Curriculum map", "Teacher & peers"] as const;
type Tab = (typeof TABS)[number];

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [cls, setCls] = useState<ClassDoc | null>(null);
  const [materials, setMaterials] = useState<MaterialDoc[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineDoc[]>([]);
  const [examReports, setExamReports] = useState<ExamReportDoc[]>([]);
  const [patternReports, setPatternReports] = useState<PatternReportDoc[]>([]);
  const [simulations, setSimulations] = useState<TeacherSimulationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("Overview");

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const c = await getClass(user.uid, id);
      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const [m, d, r, p, s] = await Promise.all([
        listMaterialsForClass(user.uid, id),
        listDeadlines(user.uid, id),
        listExamReports(user.uid, id),
        listPatternReports(user.uid, id),
        listTeacherSimulations(user.uid, id),
      ]);
      setCls(c);
      setMaterials(m);
      setDeadlines(d);
      setExamReports(r);
      setPatternReports(p);
      setSimulations(s);
      setLoading(false);
    })();
  }, [user, id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !cls) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <p className="text-sm text-zinc-500">Class not found.</p>
        <Link href="/setup" className="text-sm text-zinc-900 underline dark:text-zinc-50">
          Back to Classes
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Link href="/setup" className="text-sm text-zinc-500 hover:underline">
        ← Classes
      </Link>
      <h1 className="mt-1 text-xl font-semibold">
        {cls.subject} · Grade {cls.grade}
      </h1>
      <p className="text-sm text-zinc-500">Taught by {cls.teacherName}</p>

      <div className="mt-6">
        <WhatChangedPanel classId={cls.id} />
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="mt-6 flex flex-col gap-6">
          <ClassMemoryPanel cls={cls} />
          <MaterialsList materials={materials} />
          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-medium">Deadlines</h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {deadlines.map((d) => (
                <li key={d.id} className={`flex justify-between gap-2 ${d.done ? "text-zinc-400 line-through" : ""}`}>
                  <span>{d.title}</span>
                  <span className="text-zinc-500">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "no date"}</span>
                </li>
              ))}
              {deadlines.length === 0 && <li className="text-zinc-500">No deadlines captured yet.</li>}
            </ul>
          </section>
        </div>
      )}

      {tab === "Predict & prep" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <TeacherSimulatorPanel cls={cls} initialSimulations={simulations} />
            <ExamModePanel cls={cls} initialReports={examReports} />
          </div>
          <div className="flex flex-col gap-6">
            <PatternFinderPanel cls={cls} initialReports={patternReports} hasPastExam={materials.some((m) => m.tag === "PastExam")} />
            <ClassPredictionsPanel classId={cls.id} materials={materials} />
          </div>
        </div>
      )}

      {tab === "Intelligence" && (
        <div className="mt-6">
          <IntelligencePanel classId={cls.id} />
        </div>
      )}

      {tab === "Curriculum map" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CurriculumGraphPanel
            cls={cls}
            onSaved={(curriculumGraph) => setCls((prev) => (prev ? { ...prev, curriculumGraph } : prev))}
            hasSignal={materials.length > 0 || !!cls.curriculum || cls.topicPriorities.length > 0}
          />
          <ClassTimelinePanel cls={cls} materials={materials} />
        </div>
      )}

      {tab === "Teacher & peers" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TeacherPlaybookPanel cls={cls} onSaved={(playbook) => setCls((prev) => (prev ? { ...prev, playbook } : prev))} />
          <GroupIntelligencePanel cls={cls} />
        </div>
      )}
    </main>
  );
}
