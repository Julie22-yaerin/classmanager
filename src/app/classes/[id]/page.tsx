import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ClassMemoryPanel from "@/components/class/ClassMemoryPanel";
import MaterialsList from "@/components/class/MaterialsList";
import ExamModePanel from "@/components/class/ExamModePanel";
import type { ClassDetailDTO } from "@/lib/clientTypes";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: true,
      materials: { orderBy: { createdAt: "desc" } },
      deadlines: { orderBy: { dueDate: "asc" } },
      examReports: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!cls) notFound();

  const data = JSON.parse(JSON.stringify(cls)) as ClassDetailDTO;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Link href="/setup" className="text-sm text-zinc-500 hover:underline">
        ← Teachers &amp; Classes
      </Link>
      <h1 className="mt-1 text-xl font-semibold">
        {data.subject} · Grade {data.grade}
      </h1>
      <p className="text-sm text-zinc-500">Taught by {data.teacher.name}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ClassMemoryPanel cls={data} />
          <MaterialsList materials={data.materials} />
        </div>
        <div className="flex flex-col gap-6">
          <ExamModePanel classId={data.id} initialReports={data.examReports} />

          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-medium">Deadlines</h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {data.deadlines.map((d) => (
                <li key={d.id} className={`flex justify-between gap-2 ${d.done ? "text-zinc-400 line-through" : ""}`}>
                  <span>{d.title}</span>
                  <span className="text-zinc-500">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "no date"}</span>
                </li>
              ))}
              {data.deadlines.length === 0 && <li className="text-zinc-500">No deadlines captured yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
