import { TAG_LABELS, TAGS, type Tag } from "@/lib/types";
import type { MaterialDTO } from "@/lib/clientTypes";

export default function MaterialsList({ materials }: { materials: MaterialDTO[] }) {
  const byTag = new Map<Tag, MaterialDTO[]>();
  for (const tag of TAGS) byTag.set(tag, []);
  for (const m of materials) byTag.get(m.tag)?.push(m);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-medium">Class knowledge</h2>
      <div className="mt-3 flex flex-col gap-4">
        {TAGS.map((tag) => {
          const items = byTag.get(tag) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={tag}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {TAG_LABELS[tag]} ({items.length})
              </h3>
              <ul className="mt-1 flex flex-col gap-1.5">
                {items.slice(0, 10).map((m) => (
                  <li key={m.id} className="rounded-md border border-zinc-100 px-2.5 py-1.5 text-sm dark:border-zinc-800">
                    <div className="flex justify-between gap-2 text-xs text-zinc-500">
                      <span>{m.topic ?? "Untopiced"}</span>
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-zinc-700 dark:text-zinc-300">
                      {m.rawContent || m.extractedText || m.fileName || "(attachment)"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {materials.length === 0 && <p className="text-sm text-zinc-500">Nothing indexed yet — send something in chat tagged for this class.</p>}
      </div>
    </section>
  );
}
