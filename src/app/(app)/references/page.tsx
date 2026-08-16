"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listReferenceItems } from "@/lib/firestore/referenceItems";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { ReferenceItemDoc } from "@/lib/firestore/types";
import { RESOURCE_TYPES, type ResourceType } from "@/lib/types";

const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  video: "Video",
  article: "Article",
  practice: "Practice",
  textbook: "Textbook",
  other: "Other",
};

const RESOURCE_TYPE_STYLE: Record<ResourceType, string> = {
  video: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  article: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  practice: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  textbook: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  other: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function searchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export default function ReferencesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ReferenceItemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const result = await listReferenceItems(user.uid);
        if (!active) return;
        setItems(result);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const classNames = useMemo(() => Array.from(new Set(items.map((i) => i.className))).sort(), [items]);
  const filtered = items.filter((i) => (classFilter === "all" || i.className === classFilter) && (typeFilter === "all" || i.resourceType === typeFilter));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Reference Room</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Study resources the AI has suggested — ask for one anytime by tagging a chat message &ldquo;Find a Resource&rdquo;.
      </p>

      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All classes</option>
            {classNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ResourceType | "all")}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {filtered.map((item) => (
          <li key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <a
                href={searchUrl(item.searchQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-600 dark:text-zinc-50 dark:decoration-zinc-700 dark:hover:decoration-zinc-400"
              >
                {item.title}
              </a>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RESOURCE_TYPE_STYLE[item.resourceType]}`}>
                {RESOURCE_TYPE_LABEL[item.resourceType]}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {item.topic} · {item.className} · {timeAgo(item.createdAt)}
            </p>
          </li>
        ))}
        {filtered.length === 0 && items.length > 0 && <li className="text-sm text-zinc-500">No resources match these filters.</li>}
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Nothing here yet. In chat, tag a message &ldquo;Find a Resource&rdquo; and name a topic — suggestions land here, tagged by class and topic.
          </li>
        )}
      </ul>

      <p className="mt-6 text-xs text-zinc-400">
        The AI can&apos;t browse the internet, so each suggestion links to a search rather than a claimed direct link — that way you always land on
        something real, not a broken or invented URL.
      </p>
    </main>
  );
}
