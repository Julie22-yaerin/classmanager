import { TAG_LABELS, HOMEWORK_MODE_LABELS } from "@/lib/types";
import type { MessageDoc, ClassDoc } from "@/lib/firestore/types";
import LaurelAvatar from "@/components/LaurelAvatar";

export default function MessageBubble({
  message,
  cls,
}: {
  message: MessageDoc;
  cls: ClassDoc | undefined;
}) {
  const isUser = message.role === "user";
  const meta = [
    message.tag ? TAG_LABELS[message.tag] : null,
    message.homeworkMode ? HOMEWORK_MODE_LABELS[message.homeworkMode] : null,
    cls ? `${cls.subject} · ${cls.teacherName}` : null,
    message.fileName ? `📎 ${message.fileName}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          {meta && <div className="mb-1 text-right text-[11px] text-zinc-400 dark:text-zinc-500">{meta}</div>}
          <div className="rounded-3xl bg-zinc-100 px-4 py-2.5 text-[15px] whitespace-pre-wrap text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <LaurelAvatar size={28} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 pt-0.5">
        {meta && <div className="mb-1 text-[11px] text-zinc-400 dark:text-zinc-500">{meta}</div>}
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-100">{message.content}</div>
      </div>
    </div>
  );
}
