import { TAG_LABELS } from "@/lib/types";
import type { ChatMessageDTO, ClassDTO } from "@/lib/clientTypes";

export default function MessageBubble({
  message,
  cls,
}: {
  message: ChatMessageDTO;
  cls: ClassDTO | undefined;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-white text-zinc-900 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:border-zinc-800"
        }`}
      >
        <div className="mb-1 flex flex-wrap gap-1.5 text-[11px] opacity-70">
          {message.tag && <span className="rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/10">{TAG_LABELS[message.tag]}</span>}
          {cls && (
            <span className="rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/10">
              {cls.subject} · {cls.teacher.name}
            </span>
          )}
          {message.fileName && <span className="rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/10">📎 {message.fileName}</span>}
        </div>
        {message.content}
      </div>
    </div>
  );
}
