import { prisma } from "@/lib/db";
import DeadlineRow from "@/components/deadlines/DeadlineRow";
import type { DeadlineDTO } from "@/lib/clientTypes";

export default async function DeadlinesPage() {
  const deadlines = await prisma.deadline.findMany({
    include: { class: { include: { teacher: true } } },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }],
  });
  const data = JSON.parse(JSON.stringify(deadlines)) as DeadlineDTO[];
  const open = data.filter((d) => !d.done);
  const done = data.filter((d) => d.done);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Deadlines</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Extracted automatically from Teacher Announcements and Class Recordings across every class.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500">Open ({open.length})</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {open.map((d) => (
            <DeadlineRow key={d.id} deadline={d} />
          ))}
          {open.length === 0 && <li className="text-sm text-zinc-500">Nothing outstanding.</li>}
        </ul>
      </section>

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-zinc-500">Done ({done.length})</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {done.map((d) => (
              <DeadlineRow key={d.id} deadline={d} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
