"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { callApi, MissingApiKeyClientError } from "@/lib/apiClient";
import { toClassContext } from "@/lib/mappers";
import { listMaterialsForClass } from "@/lib/firestore/materials";
import { savePlaybook } from "@/lib/firestore/classes";
import type { ClassDoc, MaterialDoc } from "@/lib/firestore/types";
import type { TeacherPlaybookOutput } from "@/lib/teacherPlaybook";

function toMaterialSummary(m: MaterialDoc) {
  return {
    tag: m.tag,
    topic: m.topic,
    excerpt: m.rawContent || m.extractedText || m.fileName || "",
    analysis: m.analysis ? JSON.stringify(m.analysis) : null,
  };
}

export default function TeacherPlaybookPanel({ cls, onSaved }: { cls: ClassDoc; onSaved: (playbook: NonNullable<ClassDoc["playbook"]>) => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);

  async function generate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setMissingKey(false);
    try {
      const materials = await listMaterialsForClass(user.uid, cls.id);
      const { playbook } = await callApi<{ playbook: TeacherPlaybookOutput }>("/api/teacher-playbook", {
        cls: toClassContext(cls),
        materials: materials.map(toMaterialSummary),
      });

      const saved = {
        howToDealWithThisTeacher: playbook.how_to_deal_with_this_teacher,
        questionStyleSummary: playbook.question_style_summary,
        explanationStyleSummary: playbook.explanation_style_summary,
        gradingExpectations: playbook.grading_expectations,
        classroomExpectations: playbook.classroom_expectations,
        recurringPatterns: playbook.recurring_patterns,
        generatedAt: new Date().toISOString(),
      };
      await savePlaybook(user.uid, cls.id, saved);
      onSaved(saved);
    } catch (err) {
      if (err instanceof MissingApiKeyClientError) {
        setMissingKey(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate playbook");
      }
    } finally {
      setBusy(false);
    }
  }

  const playbook = cls.playbook;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Teacher Playbook</h2>
          <p className="mt-0.5 text-xs text-zinc-500">How this teacher operates, and what to actually do about it.</p>
        </div>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {busy ? "Analyzing…" : playbook ? "Refresh" : "Generate playbook"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error} {missingKey && <a href="/settings" className="underline font-medium">Add your API key</a>}
        </p>
      )}
      {!playbook && !busy && <p className="mt-3 text-sm text-zinc-500">No playbook generated yet.</p>}
      {playbook && (
        <div className="mt-4 flex flex-col gap-4 text-sm">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">How to deal with this teacher</h4>
            <ul className="mt-1 list-disc pl-5 text-zinc-700 dark:text-zinc-300">
              {playbook.howToDealWithThisTeacher.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Question style</h4>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">{playbook.questionStyleSummary}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Explanation style</h4>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">{playbook.explanationStyleSummary}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Grading expectations</h4>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">{playbook.gradingExpectations}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Classroom expectations</h4>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">{playbook.classroomExpectations}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Recurring patterns</h4>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">{playbook.recurringPatterns}</p>
          </div>
        </div>
      )}
    </section>
  );
}
