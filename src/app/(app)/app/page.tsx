"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import TagSelect from "@/components/chat/TagSelect";
import ClassSelect from "@/components/chat/ClassSelect";
import HomeworkModeSelect from "@/components/chat/HomeworkModeSelect";
import MessageBubble from "@/components/chat/MessageBubble";
import LaurelAvatar from "@/components/LaurelAvatar";
import DeadlineCalendarWidget from "@/components/home/DeadlineCalendarWidget";
import TopPredictionWidget from "@/components/home/TopPredictionWidget";
import { fileToAttachment, type PendingAttachment } from "@/lib/fileToAttachment";
import { useAuth } from "@/lib/authContext";
import { listClasses } from "@/lib/firestore/classes";
import { getUserProfile } from "@/lib/firestore/profile";
import { listMessages, createMessage } from "@/lib/firestore/messages";
import { createMaterial } from "@/lib/firestore/materials";
import { createDeadlines } from "@/lib/firestore/deadlines";
import { applyMemoryUpdate, appendImportantDates } from "@/lib/firestore/classes";
import { callApi } from "@/lib/apiClient";
import { toClassContext, toProfileContext } from "@/lib/mappers";
import type { ClassDoc, MessageDoc, UserProfile } from "@/lib/firestore/types";
import type { RunChatResult } from "@/lib/aiChat";
import type { RoutableClass, ClassRouterResult } from "@/lib/classRouter";
import type { Tag, Mode, HomeworkMode } from "@/lib/types";

interface PendingSend {
  tag: Tag;
  content: string;
  mode: Mode;
  homeworkMode: HomeworkMode | null;
  attachment: PendingAttachment | null;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [tag, setTag] = useState<Tag | "">("");
  const [classChoice, setClassChoice] = useState("auto");
  const [mode, setMode] = useState<Mode>("daily");
  const [homeworkMode, setHomeworkMode] = useState<HomeworkMode>("explain");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarification, setClarification] = useState<{ reason: string; classes: ClassDoc[]; pending: PendingSend } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [c, p, m] = await Promise.all([listClasses(user.uid), getUserProfile(user.uid), listMessages(user.uid)]);
      setClasses(c);
      setProfile(p);
      setMessages(m);
      setLoading(false);
    })();
  }, [user]);

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
      if (att.sourceType === "audio" && profile?.allowRecordingUploads === false) {
        setAttachError("Audio uploads are turned off — enable them in Settings → Privacy & Data.");
        return;
      }
      setAttachment(att);
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : "Could not attach file");
    }
  }

  async function send(payload: PendingSend, forcedClassId: string | null) {
    if (!user) return;
    setSending(true);
    setError(null);
    try {
      let classId = forcedClassId;
      if (!classId) {
        const routable: RoutableClass[] = classes.map((c) => ({ id: c.id, subject: c.subject, grade: c.grade, teacherName: c.teacherName }));
        const routingContent = payload.content || `[${payload.attachment?.sourceType ?? "file"} attachment: ${payload.attachment?.fileName ?? ""}]`;
        const routed = await callApi<ClassRouterResult>("/api/identify-class", { content: routingContent, classes: routable });
        if (routed.needsClarification || !routed.classId) {
          setClarification({ reason: routed.reason, classes, pending: payload });
          return;
        }
        classId = routed.classId;
      }

      const cls = classById.get(classId);
      if (!cls) {
        setError("Class not found — pick another one.");
        return;
      }

      const userMessage = await createMessage(user.uid, {
        classId,
        className: `${cls.subject} · ${cls.teacherName}`,
        role: "user",
        tag: payload.tag,
        mode: payload.mode,
        homeworkMode: payload.tag === "Homework" ? payload.homeworkMode : null,
        content: payload.content,
        fileName: payload.attachment?.fileName ?? null,
        materialId: null,
        createdAt: new Date().toISOString(),
      });

      const result = await callApi<RunChatResult & { skippedProcessing?: boolean }>("/api/chat", {
        cls: toClassContext(cls),
        profile: toProfileContext(profile),
        tag: payload.tag,
        content: payload.content,
        mode: payload.mode,
        homeworkMode: payload.tag === "Homework" ? payload.homeworkMode : null,
        attachment: payload.attachment,
      });

      let materialId: string | null = null;
      if (!result.skippedProcessing) {
        const material = await createMaterial(user.uid, {
          classId,
          className: `${cls.subject} · ${cls.teacherName}`,
          tag: payload.tag,
          sourceType: payload.attachment?.sourceType ?? "text",
          rawContent: payload.content || null,
          extractedText: result.usedTranscript,
          topic: result.topic,
          analysis: result.exam_analysis as unknown as Record<string, unknown> | null,
          fileName: payload.attachment?.fileName ?? null,
          mimeType: payload.attachment?.mimeType ?? null,
          timeline: null,
          createdAt: new Date().toISOString(),
        });
        materialId = material.id;

        await applyMemoryUpdate(user.uid, classId, cls, result.memory_updates);
        if (result.deadlines?.length) {
          const sourceType = payload.tag === "Announcement" ? "announcement" : "recording";
          const now = new Date().toISOString();
          await createDeadlines(
            user.uid,
            result.deadlines.map((d) => ({
              classId,
              className: cls.subject,
              teacherName: cls.teacherName,
              title: d.title,
              dueDate: d.due_date,
              sourceType,
              notes: d.notes ?? null,
              done: false,
              createdAt: now,
            })),
          );
          await appendImportantDates(
            user.uid,
            classId,
            cls,
            result.deadlines.map((d) => ({ title: d.title, date: d.due_date, source: sourceType })),
          );
        }
      }

      const assistantMessage = await createMessage(user.uid, {
        classId,
        className: `${cls.subject} · ${cls.teacherName}`,
        role: "assistant",
        tag: null,
        mode: payload.mode,
        homeworkMode: null,
        content: result.reply,
        fileName: null,
        materialId,
        createdAt: new Date().toISOString(),
      });

      setClarification(null);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      const refreshed = await listClasses(user.uid);
      setClasses(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
    const payload: PendingSend = { tag, content: text.trim(), mode, homeworkMode: tag === "Homework" ? homeworkMode : null, attachment };
    setText("");
    setAttachment(null);
    await send(payload, classChoice === "auto" ? null : classChoice);
  }

  return (
    <main className="flex min-h-full flex-col">
      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {loading && <p className="text-sm text-zinc-500">Loading…</p>}

          {!loading && classes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No classes yet.{" "}
              <Link href="/setup" className="font-medium text-zinc-900 underline dark:text-zinc-50">
                Set up a teacher and class
              </Link>{" "}
              to start chatting.
            </div>
          )}

          {!loading && classes.length > 0 && messages.length === 0 && !clarification && (
            <div className="flex flex-col items-center gap-8 py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <LaurelAvatar size={48} />
                <p className="text-2xl font-medium text-zinc-700 dark:text-zinc-200">How&apos;s school going so far?</p>
                <p className="max-w-sm text-sm text-zinc-500">
                  Tag what you send — homework, a past exam, a recording, material, notes, or an announcement — and it&apos;ll be filed into the right class.
                </p>
              </div>
              <div className="grid w-full gap-4 sm:grid-cols-2">
                <DeadlineCalendarWidget />
                <TopPredictionWidget />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} cls={m.classId ? classById.get(m.classId) : undefined} />
            ))}

            {clarification && (
              <div className="flex gap-3">
                <LaurelAvatar size={28} className="mt-0.5 shrink-0" />
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
                        {c.subject} · Grade {c.grade} ({c.teacherName})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 dark:from-[#212121] dark:via-[#212121]">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          {error && (
            <div className="mb-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          {attachError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{attachError}</p>}

          <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-[#2f2f2f]">
            <div className="flex flex-wrap items-center gap-2">
              <TagSelect value={tag} onChange={setTag} compact />
              {tag === "Homework" && <HomeworkModeSelect value={homeworkMode} onChange={setHomeworkMode} compact />}
              <ClassSelect classes={classes} value={classChoice} onChange={setClassChoice} compact />
              <div className="ml-auto flex overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-600">
                {(["daily", "exam"] as Mode[]).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                      mode === m ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-transparent text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {attachment && (
              <div className="flex items-center gap-2 px-1 text-xs text-zinc-500">
                <span>📎 {attachment.fileName}</span>
                <button type="button" onClick={() => setAttachment(null)} className="text-red-600 hover:underline dark:text-red-400">
                  remove
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <label className="flex shrink-0 cursor-pointer items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                <input
                type="file"
                accept={
                  profile?.allowRecordingUploads === false
                    ? "image/*,application/pdf"
                    : "image/*,application/pdf,audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
                }
                onChange={onFileChange}
                className="hidden"
              />
                <span aria-hidden className="text-lg leading-none">＋</span>
                <span className="sr-only">Attach a file</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste homework, an announcement, notes, a transcript…"
                rows={1}
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={sending}
                className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
