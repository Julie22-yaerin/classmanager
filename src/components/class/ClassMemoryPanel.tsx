import type { ClassDoc } from "@/lib/firestore/types";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
        {value || <span className="text-zinc-400 italic">Not learned yet</span>}
      </dd>
    </div>
  );
}

export default function ClassMemoryPanel({ cls }: { cls: ClassDoc }) {
  const topicPriorities = cls.topicPriorities ?? [];
  const importantDates = cls.importantDates ?? [];

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-medium">Class memory</h2>
      <p className="mt-0.5 text-xs text-zinc-500">Continuously updated from everything you send tagged for this class.</p>
      <dl className="mt-4 flex flex-col gap-3">
        <Field label="Textbook / materials" value={cls.textbook} />
        <Field label="Curriculum covered so far" value={cls.curriculum} />
        <Field label="Teacher persona" value={cls.teacherPersona} />
        <Field label="Teaching style" value={cls.teachingStyle} />
        <Field label="Question style" value={cls.questionStyle} />
        <Field label="Assessment patterns" value={cls.assessmentPatterns} />

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Topic priorities</dt>
          <dd className="mt-1">
            {topicPriorities.length === 0 && <span className="text-sm text-zinc-400 italic">Not learned yet</span>}
            <ul className="flex flex-col gap-1">
              {[...topicPriorities]
                .sort((a, b) => b.weight - a.weight)
                .map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 rounded bg-zinc-100 px-1.5 text-xs font-medium dark:bg-zinc-800">{t.weight}/5</span>
                    <span>
                      <strong>{t.topic}</strong> — <span className="text-zinc-500">{t.reason}</span>
                    </span>
                  </li>
                ))}
            </ul>
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Important dates</dt>
          <dd className="mt-1">
            {importantDates.length === 0 && <span className="text-sm text-zinc-400 italic">None captured yet</span>}
            <ul className="flex flex-col gap-1">
              {importantDates.map((d, i) => (
                <li key={i} className="text-sm">
                  {d.date ? <span className="font-medium">{d.date}</span> : <span className="text-zinc-400">(no date)</span>} — {d.title}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}
