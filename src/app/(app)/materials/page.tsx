"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { listClasses } from "@/lib/firestore/classes";
import { getUserProfile } from "@/lib/firestore/profile";
import { listAllMaterials } from "@/lib/firestore/materials";
import { fileToAttachment, type PendingAttachment } from "@/lib/fileToAttachment";
import { runAndPersistChatTurn } from "@/lib/chatPipeline";
import LoadingSpinner from "@/components/LoadingSpinner";
import { TAGS, TAG_LABELS, type Tag } from "@/lib/types";
import type { ClassDoc, MaterialDoc, UserProfile } from "@/lib/firestore/types";

const TAG_ICON: Record<Tag, string> = {
  Homework: "📝",
  PastExam: "🗂️",
  ClassRecording: "🎙️",
  Material: "📄",
  Notes: "🗒️",
  Announcement: "📣",
  Reference: "🔎",
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

export default function MaterialsPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [materials, setMaterials] = useState<MaterialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [classFilter, setClassFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<Tag | "all">("all");

  const [uploadClassId, setUploadClassId] = useState("");
  const [uploadTag, setUploadTag] = useState<Tag | "">("");
  const [uploadFile, setUploadFile] = useState<PendingAttachment | null>(null);
  const [uploadNote, setUploadNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [c, p, m] = await Promise.all([listClasses(user.uid), getUserProfile(user.uid), listAllMaterials(user.uid)]);
        if (!active) return;
        setClasses(c);
        setProfile(p);
        setMaterials(m);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        console.error("failed to load materials library", err);
        setLoadError("Couldn't load the materials library. Try refreshing.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const filtered = materials.filter(
    (m) => (classFilter === "all" || m.classId === classFilter) && (tagFilter === "all" || m.tag === tagFilter),
  );

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    try {
      const att = await fileToAttachment(file);
      if (att.sourceType === "audio" && profile?.allowRecordingUploads === false) {
        setUploadError("Audio uploads are turned off — enable them in Settings → Privacy & Data.");
        return;
      }
      setUploadFile(att);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not attach file");
    }
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!uploadClassId) {
      setUploadError("Pick which class this belongs to.");
      return;
    }
    if (!uploadTag) {
      setUploadError("Pick a document type.");
      return;
    }
    if (!uploadFile && !uploadNote.trim()) {
      setUploadError("Attach a file or add a note.");
      return;
    }
    const cls = classById.get(uploadClassId);
    if (!cls) {
      setUploadError("Class not found — pick another one.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await runAndPersistChatTurn(user.uid, cls, uploadClassId, profile, {
        tag: uploadTag,
        content: uploadNote.trim(),
        mode: "daily",
        homeworkMode: null,
        attachment: uploadFile,
      });
      const refreshed = await listAllMaterials(user.uid);
      setMaterials(refreshed);
      setUploadFile(null);
      setUploadNote("");
      setUploadTag("");
      setUploadClassId("");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed — try again.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-xl font-semibold">Materials Library</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Upload homework, past papers, notes, or handouts directly — labeled by class and document type, filed and analyzed the same way
        as anything sent through chat.
      </p>

      <form
        onSubmit={onUpload}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Upload</h2>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Class
            <select
              value={uploadClassId}
              onChange={(e) => setUploadClassId(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="" disabled>
                Select a class…
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subject} · Grade {c.grade} ({c.teacherName})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Document type
            <select
              value={uploadTag}
              onChange={(e) => setUploadTag(e.target.value as Tag | "")}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="" disabled>
                Select a type…
              </option>
              {TAGS.filter((t) => t !== "Reference").map((t) => (
                <option key={t} value={t}>
                  {TAG_ICON[t]} {TAG_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          File (image, PDF, or audio)
          <input
            type="file"
            accept="image/*,application/pdf,audio/*"
            onChange={onFileChange}
            className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-200"
          />
        </label>
        {uploadFile && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>📎 {uploadFile.fileName}</span>
            <button type="button" onClick={() => setUploadFile(null)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
              Remove
            </button>
          </div>
        )}

        <textarea
          value={uploadNote}
          onChange={(e) => setUploadNote(e.target.value)}
          placeholder="Optional note (or paste text content here instead of uploading a file)"
          rows={2}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />

        {uploadError && <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="self-start rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {uploading ? "Uploading…" : "Upload & file"}
        </button>
      </form>

      {loadError && <p className="mt-6 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {!loadError && materials.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.subject} · {c.teacherName}
              </option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value as Tag | "all")}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All types</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {TAG_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      )}

      {!loadError && (
        <ul className="mt-4 flex flex-col gap-3">
          {filtered.map((m) => (
            <li key={m.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {TAG_ICON[m.tag]} {m.topic ?? m.fileName ?? TAG_LABELS[m.tag]}
                </p>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {TAG_LABELS[m.tag]}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                {m.className} · {timeAgo(m.createdAt)}
              </p>
            </li>
          ))}
          {filtered.length === 0 && materials.length > 0 && <li className="text-sm text-zinc-500">No materials match these filters.</li>}
          {materials.length === 0 && (
            <li className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Nothing filed yet — upload above, or send anything through chat with a tag.
            </li>
          )}
        </ul>
      )}
    </main>
  );
}
