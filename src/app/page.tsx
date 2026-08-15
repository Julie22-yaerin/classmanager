"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import TagSelect from "@/components/chat/TagSelect";
import ClassSelect from "@/components/chat/ClassSelect";
import MessageBubble from "@/components/chat/MessageBubble";
import { fileToAttachment, type PendingAttachment } from "@/lib/fileToAttachment";
import type { Tag, Mode } from "@/lib/types";
import type { ChatMessageDTO, ClassDTO } from "@/lib/clientTypes";

interface PendingSend {
  tag: Tag;
  content: string;
  mode: Mode;
  attachment: PendingAttachment | null;
}

export default function ChatPage() {
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [tag, setTag] = useState<Tag | "">("");
  const [classChoice, setClassChoice] = useState("auto");
  const [mode, setMode] = useState<Mode>("daily");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);
  const [clarification, setClarification] = useState<{ reason: string; classes: ClassDTO[]; pending: PendingSend } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  useEffect(() => {
    (async () => {
      const [cRes, mRes] = await Promise.all([fetch("/api/classes"), fetch("/api/chat")]);
      const cJson = await cRes.json();
      const mJson = await mRes.json();
      setClasses(cJson.classes ?? []);
      setMessages(mJson.messages ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, clarification]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAttachError(null);
    try {
      const att = await fileToAttachment(file);
      setAttachment(att);
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : "Could not attach file");
    }
  }

  async function send(payload: PendingSend, classId: string | null) {
    setSending(true);
    setError(null);
    setMissingKey(false);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: payload.tag,
          content: payload.content,
          mode: payload.mode,
          classId: classId,
          attachment: payload.attachment,
        }),
      });
      const json = await res.json();

      if (res.status === 401 && json.code === "MISSING_API_KEY") {
        setMissingKey(true);
        setError(json.error);
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      if (json.needsClassSelection) {
        setClarification({ reason: json.reason, classes: json.classes ?? [], pending: payload });
        return;
      }

      setClarification(null);
      setMessages((prev) => [...prev, json.userMessage, json.assistantMessage]);
      if (!classes.some((c) => c.id === json.classId)) {
        const cRes = await fetch("/api/classes");
        setClasses((await cRes.json()).classes ?? []);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tag) {
      setError("Pick a tag before sending.");
      return;
    }
    if (!text.trim() && !attachment) {
      setError("Add text or attach a file.");
      return;
    }
    const payload: PendingSend = { tag, content: text.trim(), mode, attachment };
    setText("");
    setAttachment(null);
    await send(payload, classChoice === "auto" ? null : classChoice);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 min-h-0">
      <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}

        {!loading && classes.length === 0 && (
          <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No classes yet.{" "}
            <Link href="/setup" className="font-medium text-zinc-900 underline dark:text-zinc-50">
              Set up a teacher and class
            </Link>{" "}
            to start chatting.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} cls={m.classId ? classById.get(m.classId) : undefined} />
          ))}

          {clarification && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950">
              <p className="mb-2">{clarification.reason || "Which class is this for?"}</p>
              <div className="flex flex-wrap gap-2">
                {clarification.classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => send(clarification.pending, c.id)}
                    disabled={sending}
                    className="rounded-full border border-amber-400 bg-white px-3 py-1 text-xs font-medium hover:bg-amber-100 disabled:opacity-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    {c.subject} · Grade {c.grade} ({c.teacher.name})
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
          {missingKey && (
            <>
              {" "}
              <Link href="/settings" className="underline font-medium">
                Add your API key
              </Link>
            </>
          )}
        </div>
      )}
      {attachError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{attachError}</p>}

      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-end gap-3">
          <TagSelect value={tag} onChange={setTag} />
          <ClassSelect classes={classes} value={classChoice} onChange={setClassChoice} />
          <div className="flex flex-col gap-1 text-xs text-zinc-500">
            Mode
            <div className="flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
              {(["daily", "exam"] as Mode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-sm capitalize ${
                    mode === m ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Attach
            <input
              type="file"
              accept="image/*,application/pdf,audio/*"
              onChange={onFileChange}
              className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1.5 file:text-xs dark:file:bg-zinc-800"
            />
          </label>
        </div>

        {attachment && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>📎 {attachment.fileName}</span>
            <button type="button" onClick={() => setAttachment(null)} className="text-red-600 hover:underline dark:text-red-400">
              remove
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste homework, an announcement, notes, a transcript…"
            rows={2}
            className="flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            disabled={sending}
            className="self-end rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </main>
  );
}
